/**
 * api/stripe-webhook.js
 * Webhook de Stripe — actualiza el tier del usuario tras el pago.
 *
 * Registrar en: https://dashboard.stripe.com/webhooks
 * Eventos a escuchar:
 *  - checkout.session.completed
 *  - customer.subscription.deleted
 *  - customer.subscription.updated
 */

const Stripe  = require('stripe');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore }         = require('firebase-admin/firestore');

// Firebase Admin (solo en el backend — nunca en el cliente)
// HOOK: Descargar serviceAccountKey.json de Firebase Console → Configuración → Cuentas de servicio
// const serviceAccount = require('./serviceAccountKey.json');
// initializeApp({ credential: cert(serviceAccount) });
// const db = getFirestore();

const TIER_BY_PRICE = {
  'price_XXXXXXXXXX_pro_monthly':    'pro',
  'price_XXXXXXXXXX_expert_monthly': 'expert',
  'price_XXXXXXXXXX_pattern':        null,  // micropago, no cambia tier
};

module.exports = async (req, res) => {
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig    = req.headers['stripe-signature'];

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

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId  = session.client_reference_id;
      const tier    = session.metadata?.tier;
      const affiliateCode = session.metadata?.affiliate;

      console.log(`[Webhook] Pago completado: user=${userId}, tier=${tier}`);

      // HOOK: Actualizar tier en Firestore
      // if (userId && tier) {
      //   await db.collection('users').doc(userId).set({ tier, updatedAt: new Date() }, { merge: true });
      // }

      // HOOK: Registrar comisión del afiliado en Firestore
      // if (affiliateCode) {
      //   const commission = {
      //     userId, affiliateCode, tier,
      //     amount: session.amount_total / 100,
      //     commissionPct: 15,
      //     commission: (session.amount_total / 100) * 0.15,
      //     timestamp: new Date(),
      //     status: 'pending',
      //   };
      //   await db.collection('commissions').add(commission);
      // }

      break;
    }

    case 'customer.subscription.deleted': {
      const sub    = event.data.object;
      const userId = sub.metadata?.userId;

      // HOOK: Degradar a tier free cuando cancela
      // if (userId) {
      //   await db.collection('users').doc(userId).set({ tier: 'free' }, { merge: true });
      // }
      console.log(`[Webhook] Suscripción cancelada: user=${userId}`);
      break;
    }

    case 'customer.subscription.updated': {
      const sub     = event.data.object;
      const priceId = sub.items.data[0]?.price?.id;
      const newTier = TIER_BY_PRICE[priceId];
      const userId  = sub.metadata?.userId;

      // HOOK: Actualizar tier al cambiar de plan
      // if (userId && newTier) {
      //   await db.collection('users').doc(userId).set({ tier: newTier }, { merge: true });
      // }
      console.log(`[Webhook] Suscripción actualizada: user=${userId}, tier=${newTier}`);
      break;
    }

    default:
      console.log(`[Webhook] Evento no manejado: ${event.type}`);
  }

  return res.status(200).json({ received: true });
};
