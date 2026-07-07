/**
 * api/webhook.js
 * Vercel Serverless Function — Lemon Squeezy Webhook.
 * Actualiza el tier del usuario en Firestore cuando paga o cancela.
 *
 * Variables de entorno requeridas en Vercel:
 *   LS_WEBHOOK_SECRET      → signing secret del webhook en Lemon Squeezy
 *   LS_VARIANT_PRO         → Variant ID del plan Pro
 *   LS_VARIANT_EXPERT      → Variant ID del plan Expert
 *   FIREBASE_SERVICE_ACCOUNT → JSON completo del service account de Firebase Admin
 *                              (Firebase Console → Project Settings → Service Accounts
 *                               → Generate new private key → pegar JSON en una sola línea)
 *
 * Registrar en Lemon Squeezy Dashboard → Webhooks → Add webhook:
 *   URL: https://radical-pi.vercel.app/api/webhook
 *   Eventos: subscription_created, subscription_updated, subscription_cancelled,
 *            subscription_expired, order_created
 */

const crypto = require('crypto');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// ── Firebase Admin (se inicializa una sola vez por instancia serverless) ───
let db;
try {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(sa) });
  }
  db = getFirestore();
} catch (e) {
  console.error('[Webhook] Firebase Admin init error:', e.message);
}

// Mapeo variantId → tier
function tierFromVariant(variantId) {
  const id = String(variantId);
  if (id === String(process.env.LS_VARIANT_EXPERT)) return 'expert';
  if (id === String(process.env.LS_VARIANT_PRO))    return 'pro';
  return null;
}

// Verificar firma HMAC del webhook de Lemon Squeezy
function verifySignature(rawBody, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch { return false; }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const signature = req.headers['x-signature'];
  const secret    = process.env.LS_WEBHOOK_SECRET;

  if (!signature || !secret) {
    console.warn('[Webhook] Firma o secret ausente');
    return res.status(400).json({ error: 'Missing signature' });
  }

  // rawBody viene como Buffer cuando Vercel tiene bodyParser desactivado (ver vercel.json)
  const rawBody = req.body instanceof Buffer
    ? req.body
    : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

  if (!verifySignature(rawBody, signature, secret)) {
    console.warn('[Webhook] Firma inválida — posible replay attack');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const eventName = payload.meta?.event_name;
  const data      = payload.data;
  const uid       = data?.meta?.custom_data?.firebase_uid
                 || payload.meta?.custom_data?.firebase_uid;

  console.log(`[Webhook] Evento: ${eventName}, uid: ${uid}`);

  if (!db) {
    console.error('[Webhook] Firestore no disponible');
    return res.status(500).json({ error: 'Firestore unavailable' });
  }

  if (!uid) {
    // Sin uid no podemos actualizar nada — aceptar igual para que LS no reintente
    console.warn('[Webhook] Evento sin firebase_uid en custom_data');
    return res.status(200).json({ received: true });
  }

  try {
    switch (eventName) {

      case 'order_created': {
        // Primera compra completada
        const variantId = data?.attributes?.first_order_item?.variant_id;
        const tier = tierFromVariant(variantId);
        if (tier) {
          await db.collection('users').doc(uid).update({
            tier,
            subscriptionStatus: 'active',
            lsSubscriptionId:   String(data?.id || ''),
            lsVariantId:        String(variantId || ''),
            updatedAt:          FieldValue.serverTimestamp(),
          });
          console.log(`[Webhook] order_created → ${uid} tier=${tier}`);
        }
        break;
      }

      case 'subscription_created':
      case 'subscription_updated': {
        const variantId = data?.attributes?.variant_id;
        const status    = data?.attributes?.status; // active, past_due, cancelled, expired
        const tier      = (status === 'active' || status === 'on_trial')
          ? (tierFromVariant(variantId) || 'free')
          : 'free';
        await db.collection('users').doc(uid).update({
          tier,
          subscriptionStatus: status,
          lsSubscriptionId:   String(data?.id || ''),
          lsVariantId:        String(variantId || ''),
          updatedAt:          FieldValue.serverTimestamp(),
        });
        console.log(`[Webhook] ${eventName} → ${uid} tier=${tier} status=${status}`);
        break;
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        await db.collection('users').doc(uid).update({
          tier:               'free',
          subscriptionStatus: eventName === 'subscription_cancelled' ? 'cancelled' : 'expired',
          updatedAt:          FieldValue.serverTimestamp(),
        });
        console.log(`[Webhook] ${eventName} → ${uid} degradado a free`);
        break;
      }

      default:
        console.log(`[Webhook] Evento no manejado: ${eventName}`);
    }
  } catch (e) {
    console.error('[Webhook] Error Firestore:', e.message);
    return res.status(500).json({ error: e.message });
  }

  return res.status(200).json({ received: true });
};
