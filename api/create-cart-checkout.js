/**
 * api/create-cart-checkout.js
 * Crea una sesión de checkout en Lemon Squeezy para un carrito
 * de uno o más productos (compras únicas, no suscripciones).
 *
 * POST body: { items, uid, email, affCode, returnUrl }
 *   items: [{ variantKey, productId, name, price }]
 */

const LS_API_URL = 'https://api.lemonsqueezy.com/v1';

// Mapeo de variantKey → LS variant ID real (configurar en Vercel env vars)
function getVariantId(variantKey) {
  return process.env[variantKey] || null;
}

// Descuento por código afiliado
const AFF_CODES = {
  ATELIER10:  10,
  COSTURA20:  20,
  MODA2024:   15,
  EXPERTO25:  25,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items, uid, email, affCode, returnUrl } = req.body || {};

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No hay productos en el carrito' });
  }
  if (!uid || !email) {
    return res.status(400).json({ error: 'Autenticación requerida' });
  }

  const apiKey = process.env.LS_API_KEY;
  const storeId = process.env.LS_STORE_ID;
  const appUrl = process.env.APP_URL || 'https://radical-pi.vercel.app';

  if (!apiKey || !storeId) {
    return res.status(500).json({ error: 'Configuración de pago no disponible' });
  }

  // Si hay un único item con variant ID conocido, checkout directo de LS.
  // Para múltiples items usamos el primer item + metadata de los demás.
  // (LS no soporta carrito nativo; estrategia: un checkout por item prioritario,
  //  y el webhook registra todos los productIds del metadata.)
  const discountPct = affCode ? (AFF_CODES[affCode.toUpperCase()] || 0) : 0;

  // Resuelve el variant ID del primer item
  const firstItem = items[0];
  const variantId = getVariantId(firstItem.variantKey);

  if (!variantId) {
    // Si no hay variant IDs configurados, devuelve URL de demo
    const demoUrl = `${appUrl}/tienda?payment=demo&items=${items.length}`;
    return res.status(200).json({ url: demoUrl, demo: true });
  }

  const discountAmount = discountPct > 0
    ? Math.round(firstItem.price * discountPct) // centavos aproximados
    : undefined;

  const checkoutPayload = {
    data: {
      type: 'checkouts',
      attributes: {
        store_id: parseInt(storeId, 10),
        variant_id: parseInt(variantId, 10),
        custom_price: Math.round(firstItem.price * 100), // centavos USD
        product_options: {
          receipt_thank_you_note: '¡Gracias por tu compra en PatrónAI Pro! Revisa tu email para acceder a tus archivos.',
          redirect_url: `${appUrl}/tienda?payment=success`,
        },
        checkout_options: {
          button_color: '#8b5cf6',
        },
        checkout_data: {
          email,
          custom: {
            firebase_uid: uid,
            productIds: items.map(i => i.productId).join(','),
            affCode: affCode || '',
          },
        },
        expires_at: null,
      },
    },
  };

  try {
    const lsRes = await fetch(`${LS_API_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
      body: JSON.stringify(checkoutPayload),
    });

    const lsData = await lsRes.json();

    if (!lsRes.ok) {
      console.error('[Checkout] LS error:', JSON.stringify(lsData));
      return res.status(502).json({ error: 'Error al crear sesión de pago', detail: lsData });
    }

    const checkoutUrl = lsData?.data?.attributes?.url;
    if (!checkoutUrl) {
      return res.status(502).json({ error: 'No se recibió URL de checkout' });
    }

    return res.status(200).json({ url: checkoutUrl });
  } catch (err) {
    console.error('[Checkout] fetch error:', err);
    return res.status(500).json({ error: 'Error interno al procesar pago' });
  }
}
