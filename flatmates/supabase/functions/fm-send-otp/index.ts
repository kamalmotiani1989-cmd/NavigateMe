// Supabase Edge Function: Supabase Auth's Send SMS hook. Sends the sign-in code on WhatsApp (Meta's
// WhatsApp Cloud API, an authentication template) or, when the person picked it, by SMS (MSG91). It
// only sends to a number that asked through the app in the last 10 minutes (fm_otp_request, which also
// keeps the abuse limits), and that request says which channel to use.
//
// Turn it on: Supabase -> Authentication -> Auth Hooks -> Send SMS hook -> HTTPS, this function's URL,
// then put the hook's secret in SEND_SMS_HOOK_SECRET. Secrets (supabase secrets set ...):
//   SEND_SMS_HOOK_SECRET                the hook's secret ("v1,whsec_...")
//   WHATSAPP_TOKEN, WHATSAPP_PHONE_ID   WhatsApp Cloud API: a permanent access token and the sender's phone number ID
//   WHATSAPP_TEMPLATE                   an approved Authentication template with a copy-code button (default fm_login_code)
//   WHATSAPP_LANG, WHATSAPP_API_VERSION the template's language (default en) and Graph API version (default v23.0)
//   MSG91_AUTHKEY, MSG91_TEMPLATE_ID    MSG91's auth key and its DLT-approved OTP template
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
//
// Deploy: supabase functions deploy fm-send-otp --no-verify-jwt (the hook's signature is checked below).

import { Webhook } from "npm:standardwebhooks@1.0.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const env = (k: string, fallback = "") => Deno.env.get(k) || fallback;
const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

// Supabase passes the message on to the app as the sign-in error.
const fail = (code: number, message: string) =>
  new Response(JSON.stringify({ error: { http_code: code, message } }), { status: code, headers: { "Content-Type": "application/json" } });

async function sendWhatsApp(to: string, otp: string) {
  const url = `https://graph.facebook.com/${env("WHATSAPP_API_VERSION", "v23.0")}/${env("WHATSAPP_PHONE_ID")}/messages`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${env("WHATSAPP_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp", recipient_type: "individual", to, type: "template",
      template: {
        name: env("WHATSAPP_TEMPLATE", "fm_login_code"), language: { code: env("WHATSAPP_LANG", "en") },
        // An authentication template takes the code twice: in its text and in its copy-code button.
        components: [
          { type: "body", parameters: [{ type: "text", text: otp }] },
          { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: otp }] },
        ],
      },
    }),
  });
  if (!r.ok) throw new Error(`WhatsApp ${r.status}: ${(await r.text()).slice(0, 300)}`);
}

async function sendSms(to: string, otp: string) {
  const q = new URLSearchParams({ template_id: env("MSG91_TEMPLATE_ID"), mobile: to, otp, otp_expiry: "10" });
  const r = await fetch(`https://control.msg91.com/api/v5/otp?${q}`, {
    method: "POST", headers: { authkey: env("MSG91_AUTHKEY"), "Content-Type": "application/json" }, body: "{}",
  });
  const t = await r.json().catch(() => ({}));
  if (!r.ok || t.type === "error") throw new Error(`MSG91 ${r.status}: ${JSON.stringify(t).slice(0, 300)}`);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return fail(405, "method-not-allowed");
  const secret = env("SEND_SMS_HOOK_SECRET").replace(/^v1,whsec_/, "");
  if (!secret) return fail(503, "hook-not-set-up");
  const raw = await req.text();
  let payload: { user?: { phone?: string }; sms?: { otp?: string } };
  try {
    payload = new Webhook(secret).verify(raw, Object.fromEntries(req.headers)) as typeof payload;
  } catch (_) {
    return fail(401, "bad-signature");
  }

  const ten = String(payload.user?.phone ?? "").replace(/\D/g, "").slice(-10);
  const otp = String(payload.sms?.otp ?? "");
  if (!/^[6-9]\d{9}$/.test(ten) || !/^\d{4,10}$/.test(otp)) return fail(400, "bad-request");

  // Only numbers that asked through the app (and within its limits), on the channel they picked.
  const { data: rows, error } = await admin.from("fm_otp_requests").select("channel")
    .eq("phone", ten).gt("created_at", new Date(Date.now() - 10 * 60e3).toISOString())
    .order("created_at", { ascending: false }).limit(1);
  if (error) { console.error(error); return fail(500, "server"); }
  const channel = rows?.[0]?.channel;
  if (!channel) return fail(429, "request-first");

  try {
    if (channel === "sms") {
      if (!env("MSG91_AUTHKEY") || !env("MSG91_TEMPLATE_ID")) return fail(503, "sms-not-set-up");
      await sendSms("91" + ten, otp);
    } else {
      if (!env("WHATSAPP_TOKEN") || !env("WHATSAPP_PHONE_ID")) return fail(503, "whatsapp-not-set-up");
      await sendWhatsApp("91" + ten, otp);
    }
  } catch (e) {
    console.error(e);
    return fail(502, channel === "sms" ? "sms-failed" : "whatsapp-failed");
  }
  return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
});
