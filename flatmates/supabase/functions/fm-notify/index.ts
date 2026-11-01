// Supabase Edge Function: sends push notifications through Firebase Cloud Messaging.
//
// Called by the fm_requests_notify trigger (schema.sql) with {request_id, status}:
//   pending  -> the owner: "Riya wants to meet you · 92% match"
//   approved -> the seeker: "Asha said yes! Call now" (urgent: others are interested)
//   declined -> the seeker: "Not this time"
// Tribe events ({tribe_id, event}) are handled by tribeEvent below.
// Party invites ({party_id, event}) tell the host's flatmates: partyEvent below.
// New listings ({listing_id}) go to seekers they fit (fm_listing_audience); ticket updates ({ticket_id}) to their owner.
// Owner invites (The Empty Room Escape) go the other way:
//   pending  -> the seeker: "Ananya invited you to see their flat · 88% match"
//   approved / declined -> the owner
//
// Secrets: either as Edge Function secrets (supabase secrets set ...) or in the database:
//   NOTIFY_SECRET          same value as fm_settings.notify_secret (read from there if not set)
//   FCM_SERVICE_ACCOUNT    the Firebase service-account JSON (Project settings -> Service accounts),
//                          or fm_server_keys.value where name = 'fcm_service_account'
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

// Keys from the environment, else from the database (kept once both are there; until then, read each time).
let keys: { notify: string; fcm: string } | null = null;
async function serverKeys() {
  if (keys && keys.notify && keys.fcm) return keys;
  const { data: st } = await admin.from("fm_settings").select("notify_secret").limit(1).maybeSingle();
  const { data: k } = await admin.from("fm_server_keys").select("value").eq("name", "fcm_service_account").maybeSingle();
  keys = { notify: env("NOTIFY_SECRET") || st?.notify_secret || "", fcm: env("FCM_SERVICE_ACCOUNT") || k?.value || "" };
  return keys;
}

async function pushTo(userId: string, title: string, body: string, open: string) {
  const { data: rows } = await admin.from("fm_push_tokens").select("token").eq("user_id", userId);
  if (!rows?.length) return 0;
  const { fcm } = await serverKeys();
  if (!fcm) return 0;
  const sa = JSON.parse(fcm);
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
    // Anyone already in the tribe hears that someone new joined it: the newcomer is whichever of the two
    // they weren't already bonded with.
    const { data: ma } = await admin.rpc("fm_tribe_members", { p_user: t.a });
    const members = (ma as string[]) || [];
    for (const u of members.filter((x) => x !== t.a && x !== t.b)) {
      const [x, y] = [u, t.a].sort();
      const { data: had } = await admin.from("fm_tribe_links").select("id").eq("a", x).eq("b", y).eq("status", "bonded").maybeSingle();
      const newcomer = had ? t.b : t.a;
      await pushTo(u, `${first(newcomer)} joined your tribe`, `Your tribe is now ${members.length}. Say hi, and hunt for a ${members.length}BHK together.`, "tribe");
    }
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

// A party invite (fm_parties trigger): tell the host's flatmates (members of the flat group the host
// picked, who are on the app) that a party is happening at their place, and again if it moves or is called off.
const OCCASION: Record<string, string> = {
  party: "🎉 a house party", movie: "🎬 a movie night", games: "🎲 a game night", potluck: "🍲 a potluck", birthday: "🎂 a birthday",
  housewarming: "🏡 a housewarming", match: "🏏 a match screening", festival: "🪔 a festival night", karaoke: "🎤 a karaoke night",
  brunch: "🥞 a brunch", chai: "☕ chai and chill", terrace: "🌙 a terrace night", jam: "🎸 a jam session", farewell: "👋 a farewell",
  welcome: "🙌 a welcome party",
};
async function partyEvent(id: string, event: string) {
  const { data: p } = await admin.from("fm_parties").select("*").eq("id", id).single();
  if (!p || !p.flat_group) return { skipped: true };
  const { data: host } = await admin.from("fm_profiles").select("full_name, phone").eq("id", p.host_id).single();
  const first = (host?.full_name || "A flatmate").split(" ")[0];
  const hostPhone = (host?.phone || "").replace(/\D/g, "").slice(-10);
  const { data: members } = await admin.from("fm_split_members").select("phone").eq("group_id", p.flat_group);
  const phones = (members || []).map((m: any) => m.phone).filter((ph: string) => ph && ph !== hostPhone);
  if (!phones.length) return { sent: 0 };
  const { data: people } = await admin.from("fm_profiles").select("id, phone").in("phone", phones.map((ph: string) => "91" + ph));
  const when = new Date(p.starts_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const what = OCCASION[p.occasion] || "a get-together";
  const title = p.cancelled ? `${first} called off ${what.replace(/^\S+ /, "")}` : `${first} is hosting ${what} at your flat`;
  const body = p.cancelled ? "Nothing's happening at your place after all." : `${when}${event === "update" ? " (updated)" : ""}. See the invite and say if you're in.`;
  let sent = 0;
  for (const u of people || []) sent += await pushTo(u.id, title, body, "party/" + p.code);
  return { sent };
}

// A new listing: everyone it fits (city, areas, kind, 70%+ vibe; whole flats for tribes of that size).
const KIND: Record<string, string> = { room: "private room", flatmate: "private room", shared: "shared room", flat: "whole flat" };
async function listingEvent(id: string) {
  const { data: l } = await admin.from("fm_listings").select("id, kind, title, locality, rent, bhk, status").eq("id", id).single();
  if (!l || l.status !== "active") return { skipped: true };
  const { data: rows, error } = await admin.rpc("fm_listing_audience", { p_listing: id });
  if (error) throw error;
  let sent = 0;
  for (const r of (rows || []) as { user_id: string; match_pct: number | null; for_tribe: boolean }[]) {
    const title = r.for_tribe ? `🏠 A ${l.bhk}BHK for your tribe in ${l.locality}`
      : `New ${KIND[l.kind] || "home"} in ${l.locality}${r.match_pct != null ? ` · ${r.match_pct}% vibe` : ""}`;
    sent += await pushTo(r.user_id, title, `${l.title} · ₹${Number(l.rent).toLocaleString("en-IN")}/month. Have a look before it's gone.`, "discover");
  }
  return { sent };
}
// The team changed a ticket's status or replied.
const TICKET_STATUS: Record<string, string> = { open: "Received", in_review: "Being looked at", resolved: "Resolved", closed: "Closed" };
async function ticketEvent(id: string) {
  const { data: t } = await admin.from("fm_tickets").select("code, user_id, status, reply").eq("id", id).single();
  if (!t) return { skipped: true };
  return { sent: await pushTo(t.user_id, `Update on your ticket ${t.code}: ${TICKET_STATUS[t.status] || t.status}`, t.reply ? String(t.reply).slice(0, 160) : "Open Help to see it.", "help") };
}

Deno.serve(async (req) => {
  const { notify } = await serverKeys();
  if (!notify || req.headers.get("x-notify-secret") !== notify) return json({ error: "forbidden" }, 403);
  try {
    const payload = await req.json();
    if (payload.tribe_id) return json(await tribeEvent(payload.tribe_id, payload.event));
    if (payload.party_id) return json(await partyEvent(payload.party_id, payload.event));
    if (payload.listing_id) return json(await listingEvent(payload.listing_id));
    if (payload.ticket_id) return json(await ticketEvent(payload.ticket_id));
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
