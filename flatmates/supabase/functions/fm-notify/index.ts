// Supabase Edge Function: sends push notifications through Firebase Cloud Messaging.
//
// Called by the fm_requests_notify trigger (schema.sql) with {request_id, status}:
//   pending  -> the owner: "Riya wants to meet you · 92% match"
//   approved -> the seeker: "Asha said yes! Call now" (urgent: others are interested)
//   declined -> the seeker: "Not this time"
//
// Secrets (supabase secrets set ...):
//   NOTIFY_SECRET          same value as fm_settings.notify_secret
//   FCM_SERVICE_ACCOUNT    the Firebase service-account JSON (Project settings -> Service accounts)
// Deploy: supabase functions deploy fm-notify --no-verify-jwt

import { createClient } from "jsr:@supabase/supabase-js@2";

const env = (k: string) => Deno.env.get(k) ?? "";
const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const OCC: Record<string, string> = { working: "Working professional", student: "Student", self: "Self-employed", between: "Between jobs" };

// ---- Google OAuth token from the service account (JWT signed with RS256), cached for ~50 min.
let cached: { token: string; until: number } | null = null;
const b64url = (b: ArrayBuffer | string) =>
  btoa(typeof b === "string" ? b : String.fromCharCode(...new Uint8Array(b))).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

async function accessToken(sa: { client_email: string; private_key: string }) {
  if (cached && cached.until > Date.now()) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${head}.${claim}`));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${b64url(sig)}` }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error("oauth: " + JSON.stringify(j));
  cached = { token: j.access_token, until: Date.now() + 50 * 60 * 1000 };
  return cached.token;
}

async function pushTo(userId: string, title: string, body: string, open: string) {
  const { data: rows } = await admin.from("fm_push_tokens").select("token").eq("user_id", userId);
  if (!rows?.length) return 0;
  const sa = JSON.parse(env("FCM_SERVICE_ACCOUNT"));
  const auth = await accessToken(sa);
  let sent = 0;
  for (const { token } of rows) {
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${auth}`, "Content-Type": "application/json" },
      // Data-only + high priority so PushService shows it even when the app is closed.
      body: JSON.stringify({ message: { token, data: { title, body, open }, android: { priority: "high" } } }),
    });
    if (r.ok) sent++;
    else if (r.status === 404 || r.status === 400) await admin.from("fm_push_tokens").delete().eq("token", token);   // uninstalled
  }
  return sent;
}

Deno.serve(async (req) => {
  if (req.headers.get("x-notify-secret") !== env("NOTIFY_SECRET") || !env("NOTIFY_SECRET")) return json({ error: "forbidden" }, 403);
  try {
    const { request_id } = await req.json();
    const { data: r } = await admin.from("fm_requests")
      .select("id, status, match_pct, seeker_id, listing_id, fm_listings(title, owner_id)").eq("id", request_id).single();
    if (!r) return json({ error: "not-found" }, 404);
    const listing = (r as any).fm_listings;

    if (r.status === "pending") {
      const { data: s } = await admin.from("fm_profiles").select("full_name, occupation").eq("id", r.seeker_id).single();
      const name = s?.full_name || "Someone";
      const occ = s?.occupation?.what || OCC[s?.occupation?.type] || "";
      const sent = await pushTo(listing.owner_id, `${name} wants to meet you${r.match_pct != null ? ` · ${r.match_pct}% match` : ""}`,
        `${[name, occ].filter(Boolean).join(", ")} is interested in “${listing.title}”. Reply soon: people who fit usually find a room within days.`,
        "requests");
      return json({ sent });
    }
    if (r.status === "approved") {
      const { data: pv } = await admin.from("fm_listing_private").select("contact_name").eq("listing_id", r.listing_id).single();
      const { count } = await admin.from("fm_requests").select("id", { count: "exact", head: true }).eq("listing_id", r.listing_id);
      const owner = pv?.contact_name || "The owner";
      const others = (count ?? 1) - 1;
      const sent = await pushTo(r.seeker_id, `${owner} said yes! Call now`,
        `${others > 0 ? `${others} other ${others === 1 ? "person has" : "people have"} asked about this home. ` : ""}Homes like “${listing.title}” get rented out fast. Call ${owner} before someone else does.`,
        "requests");
      return json({ sent });
    }
    if (r.status === "declined") {
      const sent = await pushTo(r.seeker_id, "Not this time",
        `The owner of “${listing.title}” went with someone else. Your other matches are waiting.`, "discover");
      return json({ sent });
    }
    return json({ skipped: r.status });
  } catch (e) {
    console.error(e);
    return json({ error: "server" }, 500);
  }
});
