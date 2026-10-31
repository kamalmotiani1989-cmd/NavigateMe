// fm-login: TESTING ONLY. Signs someone in with their mobile number and a shared test code,
// with no SMS, while phone login (Supabase Auth -> Phone + an SMS provider) isn't set up.
// The code is stored scrambled in the database (fm_secrets, checked by fm_test_code_ok; see schema.sql
// for how to change it), never in this repo or the app; with no code set, test login is off. Wrong codes
// are limited (fm_login_fails) so it can't be guessed. Anyone who knows the code can sign in as any
// number, so turn it off before real users:
//   update fm_settings set test_login = false;
// Deployed with verify_jwt = false: the code check below is the only gate. With TURNSTILE_SECRET set
// (Cloudflare Turnstile, the app's bot check), it also needs a valid bot-check token.
import { createClient } from "jsr:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL")!;
const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
const admin = createClient(url, service, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Each number gets a fixed password nobody sees, derived from the service key.
async function passwordFor(phone: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(service), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("fm-login:" + phone));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// Cloudflare Turnstile, when its secret is set: the token from the app's bot check must be valid.
async function humanCheck(token: string, req: Request, ip: string) {
  const secret = Deno.env.get("TURNSTILE_SECRET");
  if (!secret) return true;
  if (!token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const out = await r.json().catch(() => ({}));
  return out.success === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method-not-allowed" }, 405);
  const { phone, code, captcha } = await req.json().catch(() => ({}));
  if (!/^[6-9][0-9]{9}$/.test(String(phone ?? ""))) return json({ error: "bad-phone" }, 400);

  const { data: settings } = await admin.from("fm_settings").select("test_login").single();
  if (!settings?.test_login) return json({ error: "test-login-off" }, 403);

  // Wrong codes in the last hour: 5 per number, 10 per network address, 30 in all.
  const ip = req.headers.get("cf-connecting-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const since = new Date(Date.now() - 3600e3).toISOString();
  const fails = async (col?: string, val?: string) => {
    let q = admin.from("fm_login_fails").select("id", { count: "exact", head: true }).gt("created_at", since);
    if (col) q = q.eq(col, val);
    const { count, error } = await q;
    if (error) throw error;
    return count ?? 0;
  };
  try {
    if ((await fails("phone", phone)) >= 5 || (ip && (await fails("ip", ip)) >= 10) || (await fails()) >= 30) {
      return json({ error: "too-many-tries" }, 429);
    }
  } catch (e) {
    console.error(e);
    return json({ error: "server" }, 500);
  }
  // null: no code set yet.
  const { data: ok, error: codeError } = await admin.rpc("fm_test_code_ok", { p_code: String(code ?? "").trim() });
  if (codeError) { console.error(codeError); return json({ error: "server" }, 500); }
  if (ok === null) return json({ error: "test-login-off", why: "no-code-set" }, 403);
  if (ok !== true) {
    await admin.from("fm_login_fails").delete().lt("created_at", new Date(Date.now() - 86400e3).toISOString());
    await admin.from("fm_login_fails").insert({ phone, ip: ip || null });
    return json({ error: "bad-code" }, 401);
  }
  if (!(await humanCheck(String(captcha ?? ""), req, ip))) return json({ error: "bot-check" }, 403);

  const email = `${phone}@test.findmyflatmate.app`, password = await passwordFor(phone);
  // First sign-in creates the account; after that this just reports "already registered".
  await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { phone } });
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) return json({ error: "sign-in-failed", detail: error?.message }, 500);
  // Same format Supabase phone login uses (91XXXXXXXXXX), so the rest of the app is unchanged.
  await admin.from("fm_profiles").update({ phone: "91" + phone }).eq("id", data.user.id);
  return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
});
