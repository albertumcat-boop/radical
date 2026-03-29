/**
 * api/create-checkout-session.js
 * Vercel Serverless Function — Stripe Checkout.
 *
 * SETUP:
 *  1. npm install stripe
 *  2. En Vercel Settings → Environment Variables:
 *     STRIPE_SECRET_KEY = sk_live_XXXXXXXX
 *     STRIPE_WEBHOOK_SECRET = whsec_XXXXXXXX
 *     NEXT_PUBLIC_BASE_URL = https://tu-dominio.vercel.app
 */

const Stripe = require('stripe');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_BASE_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { priceId, userId, tier, affiliate, discount } = req.body;

    // Validar affiliate code en backend (NO en frontend)
    let discountAmount = 0;
    let couponId = null;
    if (affiliate && discount > 0) {
      // HOOK: Buscar el código en Firestore/DB y validarlo
      // const affiliateDoc = await db.collection('affiliates').doc(affiliate).get();
      // if (affiliateDoc.exists && affiliateDoc.data().active) {
      //   discountAmount = affiliateDoc.data().discount;
      // }

      // Demo: crear cupón on-the-fly en Stripe
      const coupon = await stripe.coupons.create({
        percent_off: discount,
        duration: 'once',
        name: `Código Atelier ${affiliate}`,
      });
      couponId = coupon.id;
    }

    const sessionConfig = {
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?tier=${tier}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_BASE_URL}/?cancelled=true`,
      client_reference_id: userId,
      metadata: { tier, affiliate: affiliate || '', userId },
      allow_promotion_codes: true,
    };

    if (couponId) sessionConfig.discounts = [{ coupon: couponId }];

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({ sessionId: session.id });

  } catch (err) {
    console.error('[Stripe] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
