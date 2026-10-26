// fm-login: TESTING ONLY. Signs someone in with their mobile number and a shared test code,
// with no SMS, while phone login (Supabase Auth -> Phone + an SMS provider) isn't set up.
// Anyone who knows the code can sign in as any number, so turn it off before real users:
//   update fm_settings set test_login = false;
// Deployed with verify_jwt = false: the code check below is the only gate.
import { createClient } from "jsr:@supabase/supabase-js@2";

const TEST_CODE = "123456";
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method-not-allowed" }, 405);
  const { phone, code } = await req.json().catch(() => ({}));
  if (!/^[6-9][0-9]{9}$/.test(String(phone ?? ""))) return json({ error: "bad-phone" }, 400);

  const { data: settings } = await admin.from("fm_settings").select("test_login").single();
  if (!settings?.test_login) return json({ error: "test-login-off" }, 403);
  if (String(code ?? "") !== TEST_CODE) return json({ error: "bad-code" }, 401);

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
