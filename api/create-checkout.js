/**
 * api/create-checkout.js
 * Vercel Serverless Function — Lemon Squeezy Checkout.
 *
 * Variables de entorno requeridas en Vercel Dashboard → Settings → Env Vars:
 *   LS_API_KEY        → tu API key de Lemon Squeezy (Account → API)
 *   LS_STORE_ID       → ID numérico de tu tienda en Lemon Squeezy
 *   LS_VARIANT_PRO    → Variant ID del plan Pro ($9.99/mes)
 *   LS_VARIANT_EXPERT → Variant ID del plan Expert ($24.99/mes)
 *   APP_URL           → https://radical-pi.vercel.app
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { variantKey, planId, uid, email } = req.body || {};
  if (!uid || !variantKey) {
    return res.status(400).json({ error: 'uid y variantKey son obligatorios' });
  }

  // Resolver el Variant ID desde variables de entorno (nunca desde el cliente)
  const variantMap = {
    LS_VARIANT_PRO:    process.env.LS_VARIANT_PRO,
    LS_VARIANT_EXPERT: process.env.LS_VARIANT_EXPERT,
  };
  const variantId = variantMap[variantKey];
  if (!variantId) {
    return res.status(400).json({ error: 'Plan no reconocido' });
  }

  try {
    const body = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: email || undefined,
            custom: { firebase_uid: uid, plan: planId || '' },
          },
          product_options: {
            redirect_url: `${process.env.APP_URL || ''}?payment=success`,
          },
        },
        relationships: {
          store: {
            data: { type: 'stores', id: String(process.env.LS_STORE_ID) },
          },
          variant: {
            data: { type: 'variants', id: String(variantId) },
          },
        },
      },
    };

    const lsRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LS_API_KEY}`,
        'Content-Type':  'application/vnd.api+json',
        'Accept':        'application/vnd.api+json',
      },
      body: JSON.stringify(body),
    });

    if (!lsRes.ok) {
      const err = await lsRes.json().catch(() => ({}));
      console.error('[Checkout] Lemon Squeezy error:', JSON.stringify(err));
      return res.status(500).json({ error: 'Error al crear el checkout' });
    }

    const data = await lsRes.json();
    const url  = data?.data?.attributes?.url;
    if (!url) return res.status(500).json({ error: 'URL de checkout no recibida' });

    return res.status(200).json({ url });

  } catch (e) {
    console.error('[Checkout] Error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
