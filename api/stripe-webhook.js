/**
 * api/stripe-webhook.js
 * Webhook de Stripe — actualiza el tier del usuario tras el pago.
 *
 * Variables de entorno requeridas en Vercel:
 *   STRIPE_SECRET_KEY          → sk_live_XXXX
 *   STRIPE_WEBHOOK_SECRET      → whsec_XXXX
 *   FIREBASE_SERVICE_ACCOUNT   → JSON completo del serviceAccount (en una sola línea)
 *
 * Registrar en: https://dashboard.stripe.com/webhooks
 * Eventos: checkout.session.completed, customer.subscription.deleted,
 *          customer.subscription.updated
 */

const Stripe = require('stripe');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// ── Firebase Admin — inicializar una sola vez ─────────────────────────
let db;
try {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(serviceAccount) });
  }
  db = getFirestore();
} catch (e) {
  console.error('[Webhook] Error inicializando Firebase Admin:', e.message);
}

// Price IDs de Stripe — actualizar con los IDs reales del dashboard
const TIER_BY_PRICE = {
  [process.env.STRIPE_PRICE_PRO]:    'pro',
  [process.env.STRIPE_PRICE_EXPERT]: 'expert',
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig    = req.headers['stripe-signature'];

  if (!sig) return res.status(400).send('Missing stripe-signature header');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[Webhook] Firma inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (!db) {
    console.error('[Webhook] Firestore no disponible — evento ignorado:', event.type);
    return res.status(500).json({ error: 'Firestore no disponible' });
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session       = event.data.object;
        const userId        = session.client_reference_id;
        const tier          = session.metadata?.tier;
        const affiliateCode = session.metadata?.affiliate;
        const amount        = (session.amount_total || 0) / 100;

        console.log(`[Webhook] Pago completado: user=${userId}, tier=${tier}, amount=$${amount}`);

        if (userId && (tier === 'pro' || tier === 'expert')) {
          await db.collection('users').doc(userId).set(
            { tier, updatedAt: new Date(), stripeCustomer: session.customer },
            { merge: true }
          );
          console.log(`[Webhook] Tier actualizado en Firestore: ${userId} → ${tier}`);
        }

        if (affiliateCode && amount > 0) {
          const commissionPct = 15;
          await db.collection('commissions').add({
            userId,
            affiliateCode,
            tier,
            amount,
            commissionPct,
            commission: +(amount * commissionPct / 100).toFixed(2),
            timestamp:  new Date(),
            status:     'pending',
          });
          console.log(`[Webhook] Comisión registrada para: ${affiliateCode}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub    = event.data.object;
        const userId = sub.metadata?.userId;
        if (userId) {
          await db.collection('users').doc(userId).set(
            { tier: 'free', updatedAt: new Date() },
            { merge: true }
          );
          console.log(`[Webhook] Suscripción cancelada — tier degradado a free: ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub     = event.data.object;
        const priceId = sub.items.data[0]?.price?.id;
        const newTier = TIER_BY_PRICE[priceId];
        const userId  = sub.metadata?.userId;
        if (userId && newTier) {
          await db.collection('users').doc(userId).set(
            { tier: newTier, updatedAt: new Date() },
            { merge: true }
          );
          console.log(`[Webhook] Suscripción actualizada: ${userId} → ${newTier}`);
        }
        break;
      }

      default:
        console.log(`[Webhook] Evento no manejado: ${event.type}`);
    }
  } catch (err) {
    console.error('[Webhook] Error procesando evento:', err.message);
    return res.status(500).json({ error: err.message });
  }

  return res.status(200).json({ received: true });
};
