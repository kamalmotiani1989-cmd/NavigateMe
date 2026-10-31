// Supabase Edge Function: sends push notifications through Firebase Cloud Messaging.
//
// Called by the fm_requests_notify trigger (schema.sql) with {request_id, status}:
//   pending  -> the owner: "Riya wants to meet you · 92% match"
//   approved -> the seeker: "Asha said yes! Call now" (urgent: others are interested)
//   declined -> the seeker: "Not this time"
// Tribe events ({tribe_id, event}) are handled by tribeEvent below.
// Owner invites (The Empty Room Escape) go the other way:
//   pending  -> the seeker: "Ananya invited you to see their flat · 88% match"
//   approved / declined -> the owner
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

// Build your tribe (fm_tribe_links trigger): a new 70%+ match goes to both people, a "yes"
// goes to the other person, a bond (both said yes) goes to both, and leaving goes to the one who stayed.
async function tribeEvent(id: string, event: string) {
  const { data: t } = await admin.from("fm_tribe_links").select("*").eq("id", id).single();
  if (!t || t.status === "closed") return { skipped: true };
  const { data: people } = await admin.from("fm_profiles").select("id, full_name").in("id", [t.a, t.b]);
  const first = (uid: string) => ((people || []).find((p: any) => p.id === uid)?.full_name || "Someone").split(" ")[0];
  const pct = t.match_pct != null ? ` · ${t.match_pct}% vibe` : "";
  if (t.status === "left") {
    // Someone left the tribe: tell the one who stayed.
    const stayed = t.left_by === t.a ? t.b : t.a;
    await pushTo(stayed, `${first(t.left_by)} left your tribe`, "You can team up with someone new on the Tribe tab.", "tribe");
    return { sent: "left" };
  }
  if (t.status === "bonded") {
    await pushTo(t.a, `You and ${first(t.b)} are a tribe!`, `Numbers are shared. Call ${first(t.b)} and start hunting for a whole flat together.`, "tribe");
    await pushTo(t.b, `You and ${first(t.a)} are a tribe!`, `Numbers are shared. Call ${first(t.a)} and start hunting for a whole flat together.`, "tribe");
    return { sent: "bonded" };
  }
  if (event === "insert") {
    const body = "Build a tribe, hunt for a whole flat together and split the rent.";
    await pushTo(t.a, `${first(t.b)} could be your flatmate${pct}`, body, "tribe");
    await pushTo(t.b, `${first(t.a)} could be your flatmate${pct}`, body, "tribe");
    return { sent: "match" };
  }
  if (t.a_yes && t.b_yes == null) await pushTo(t.b, `${first(t.a)} wants to build a tribe with you`, "Say yes and you'll both get each other's numbers.", "tribe");
  if (t.b_yes && t.a_yes == null) await pushTo(t.a, `${first(t.b)} wants to build a tribe with you`, "Say yes and you'll both get each other's numbers.", "tribe");
  return { sent: "yes" };
}

Deno.serve(async (req) => {
  if (req.headers.get("x-notify-secret") !== env("NOTIFY_SECRET") || !env("NOTIFY_SECRET")) return json({ error: "forbidden" }, 403);
  try {
    const payload = await req.json();
    if (payload.tribe_id) return json(await tribeEvent(payload.tribe_id, payload.event));
    const { request_id } = payload;
    const { data: r } = await admin.from("fm_requests")
      .select("id, status, match_pct, seeker_id, listing_id, initiated_by, fm_listings(title, owner_id)").eq("id", request_id).single();
    if (!r) return json({ error: "not-found" }, 404);
    const listing = (r as any).fm_listings;

    if (r.initiated_by === "owner") {
      if (r.status === "pending") {
        const { data: pv } = await admin.from("fm_listing_private").select("contact_name").eq("listing_id", r.listing_id).single();
        const owner = (pv?.contact_name || "An owner").split(" ")[0];
        const sent = await pushTo(r.seeker_id, `${owner} invited you to see their flat${r.match_pct != null ? ` · ${r.match_pct}% match` : ""}`,
          `See the photos of “${listing.title}” and say yes or no in one tap. Your number stays private unless you say yes.`, "requests");
        return json({ sent });
      }
      if (r.status === "approved" || r.status === "declined") {
        const { data: s } = await admin.from("fm_profiles").select("full_name").eq("id", r.seeker_id).single();
        const name = (s?.full_name || "They").split(" ")[0];
        const sent = r.status === "approved"
          ? await pushTo(listing.owner_id, `${name} accepted your invite! Call now`,
              `${name} wants to see “${listing.title}”. Your numbers are shared, so call while they're keen.`, "requests")
          : await pushTo(listing.owner_id, `${name} passed this time`,
              `Find more people looking in your area in The Empty Room Escape.`, "escape");
        return json({ sent });
      }
      return json({ skipped: r.status });
    }

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
