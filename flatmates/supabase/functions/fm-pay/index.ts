// Supabase Edge Function: Razorpay checkout for plans (Room Pass, Tribe Pass, Premium, Escape Pass...).
//
//   POST /fm-pay/order    (signed-in user)  {plan, listing_id?} -> a Razorpay order for the plan's
//                                            price plus GST (fm_plans.base_paise, fm_settings.gst_percent)
//   POST /fm-pay/verify   (signed-in user)  -> checks the checkout signature, grants the plan
//   POST /fm-pay/webhook  (Razorpay)        -> same granting, as a backstop
//
// Secrets (supabase secrets set ...):
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
//
// Deploy: supabase functions deploy fm-pay --no-verify-jwt
// (JWT is checked below for /order and /verify; /webhook is signed by Razorpay instead.)

import { createClient } from "jsr:@supabase/supabase-js@2";

const env = (k: string) => Deno.env.get(k) ?? "";
const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function hmacHex(secret: string, msg: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function userFrom(req: Request) {
  const client = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data } = await client.auth.getUser();
  return data.user;
}

async function credit(orderId: string, paymentId: string) {
  const { data, error } = await admin.rpc("fm_credit_order", {
    p_razorpay_order: orderId, p_razorpay_payment: paymentId,
  });
  if (error) throw error;
  return data as number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const route = new URL(req.url).pathname.split("/").pop();

  try {
    if (route === "order") {
      const user = await userFrom(req);
      if (!user) return json({ error: "not-signed-in" }, 401);
      // Until the Razorpay keys are added as function secrets, say so instead of failing at Razorpay.
      if (!env("RAZORPAY_KEY_ID") || !env("RAZORPAY_KEY_SECRET")) return json({ error: "payments-not-set-up" }, 503);

      const { plan: planId, listing_id } = await req.json().catch(() => ({}));
      const { data: plan } = await admin.from("fm_plans").select("*").eq("id", planId).eq("enabled", true).maybeSingle();
      if (!plan) return json({ error: "no-such-plan" }, 400);
      // A featured listing must be the buyer's own.
      if (plan.featured_days > 0) {
        const { data: l } = await admin.from("fm_listings").select("owner_id").eq("id", listing_id ?? "").maybeSingle();
        if (!l || l.owner_id !== user.id) return json({ error: "not-your-listing" }, 403);
      }
      const { data: settings } = await admin.from("fm_settings").select("gst_percent").single();
      const gst = Math.round(plan.base_paise * Number(settings?.gst_percent ?? 18) / 100);
      const amount = plan.base_paise + gst;

      const auth = btoa(`${env("RAZORPAY_KEY_ID")}:${env("RAZORPAY_KEY_SECRET")}`);
      const r = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency: "INR", notes: { user_id: user.id, plan: plan.id } }),
      });
      const order = await r.json();
      if (!r.ok) return json({ error: "razorpay", detail: order }, 502);

      const { error } = await admin.from("fm_orders").insert({
        user_id: user.id, razorpay_order_id: order.id, amount_paise: amount, credits: 0,
        plan: plan.id, base_paise: plan.base_paise, gst_paise: gst, listing_id: plan.featured_days > 0 ? listing_id : null,
      });
      if (error) throw error;
      return json({ key_id: env("RAZORPAY_KEY_ID"), order_id: order.id, amount, plan: plan.name });
    }

    if (route === "verify") {
      const user = await userFrom(req);
      if (!user) return json({ error: "not-signed-in" }, 401);
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

      const expected = await hmacHex(env("RAZORPAY_KEY_SECRET"), `${razorpay_order_id}|${razorpay_payment_id}`);
      if (!safeEqual(expected, String(razorpay_signature))) return json({ error: "bad-signature" }, 400);

      const { data: row } = await admin.from("fm_orders")
        .select("user_id").eq("razorpay_order_id", razorpay_order_id).single();
      if (!row || row.user_id !== user.id) return json({ error: "order-not-yours" }, 403);

      return json({ credited: await credit(razorpay_order_id, razorpay_payment_id) });
    }

    if (route === "webhook") {
      // Without its secret nothing can be checked, so nothing is accepted.
      if (!env("RAZORPAY_WEBHOOK_SECRET")) return json({ error: "webhook-not-set-up" }, 503);
      const raw = await req.text();
      const expected = await hmacHex(env("RAZORPAY_WEBHOOK_SECRET"), raw);
      if (!safeEqual(expected, req.headers.get("x-razorpay-signature") ?? "")) {
        return json({ error: "bad-signature" }, 400);
      }
      const evt = JSON.parse(raw);
      if (evt.event === "payment.captured" || evt.event === "order.paid") {
        const p = evt.payload.payment.entity;
        await credit(p.order_id, p.id);
      }
      return json({ ok: true });
    }

    return json({ error: "not-found" }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: "server" }, 500);
  }
});
