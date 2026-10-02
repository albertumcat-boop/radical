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

  // Descuentos válidos definidos en servidor — NUNCA desde el cliente
  const VALID_AFF_CODES = {
    ATELIER10: 10, COSTURA20: 20, MODA2024: 15, EXPERTO25: 25,
  };

  try {
    const { priceId, userId, tier, affiliate } = req.body;
    // El campo 'discount' del body se ignora — el descuento lo determina el servidor

    // Validar priceId contra una whitelist para evitar que el cliente pase IDs arbitrarios
    const VALID_PRICE_IDS = [
      process.env.STRIPE_PRICE_PRO,
      process.env.STRIPE_PRICE_EXPERT,
    ].filter(Boolean);
    if (VALID_PRICE_IDS.length > 0 && !VALID_PRICE_IDS.includes(priceId)) {
      return res.status(400).json({ error: 'Plan inválido' });
    }

    let couponId = null;
    if (affiliate) {
      const serverDiscount = VALID_AFF_CODES[affiliate.toUpperCase().trim()];
      if (serverDiscount) {
        const coupon = await stripe.coupons.create({
          percent_off: serverDiscount,
          duration: 'once',
          name: `Código Atelier ${affiliate.toUpperCase()}`,
        });
        couponId = coupon.id;
      }
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
    return res.status(500).json({ error: 'Error al procesar el pago. Intenta de nuevo.' });
  }
};
