# 💰 Guía de Monetización — PatrónAI Pro

## Arquitectura de pagos
```
Usuario (Frontend)
    │
    ├─► [Diseñar patrón] → GRATIS (todos los tiers)
    ├─► [Ver en 3D]      → GRATIS (todos los tiers)
    │
    └─► [Descargar PDF]
            │
            ├─► Tier Free + NO comprado → PaymentUI.showPatternPaywall()
            │       │
            │       └─► [Pago $0.99-$1.99] → /api/create-payment-intent
            │                               → Stripe Payment Intent
            │                               → onSuccess → PDF descargado
            │
            ├─► Tier Free + YA comprado → PDF con DEMO watermark
            │
            └─► Tier Pro/Expert → PDF limpio directo

Upgrade de tier:
    PaymentUI.showUpgradeModal()
        └─► /api/create-checkout-session
            └─► Stripe Checkout Page
                └─► stripe-webhook.js (on: checkout.session.completed)
                    └─► Firestore: users/{uid}/tier = 'pro' | 'expert'
```

## Flujo de afiliados
```
1. Atelier se registra → recibe código único (ej: ATELIER10)
2. Atelier comparte código con sus clientes
3. Cliente ingresa código en PatrónAI
4. Descuento 10-25% aplicado automáticamente
5. Cada compra del cliente → comisión 15-20% para el atelier
6. Comisiones → Stripe Connect (payouts automáticos)
```

## Pasos para activar pagos en producción

### 1. Stripe
```bash
# Instalar dependencias de backend
npm install stripe

# Variables de entorno en Vercel:
STRIPE_SECRET_KEY=sk_live_XXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXX
NEXT_PUBLIC_BASE_URL=https://tu-dominio.vercel.app
```

### 2. Crear productos en Stripe Dashboard

| Producto       | Precio        | Price ID (copiar a payment.js) |
|----------------|---------------|-------------------------------|
| PatrónAI Pro   | $9.99/mes     | price_XXXX_pro                |
| PatrónAI Expert| $24.99/mes    | price_XXXX_expert             |
| Patrón Single  | $0.99-$1.99   | price_XXXX_pattern            |

### 3. Registrar Webhook

En https://dashboard.stripe.com/webhooks → Add endpoint:
- URL: `https://tu-dominio.vercel.app/api/stripe-webhook`
- Eventos: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`

### 4. Firebase Auth (para persistir tier entre sesiones)
```javascript
// En firebase-config.js, reemplazar _loadTierFromStorage():
const user  = firebase.auth().currentUser;
const token = await user.getIdTokenResult();
return token.claims.tier || 'free';

// En el webhook, después de actualizar Firestore:
// Usar Firebase Admin SDK para setCustomUserClaims({ tier: 'pro' })
```

### 5. Programa de afiliados (Stripe Connect)
```bash
# En Stripe Dashboard → Connect → Accounts
# Cada atelier crea una cuenta Connect
# Usar stripe.transfers.create() en el webhook para enviar comisiones
```

## Proyección de ingresos

| Escenario | Usuarios | Conversión | MRR      |
|-----------|----------|-----------|----------|
| Conservador | 100   | 5% Pro    | $499/mes |
| Moderado    | 500   | 8% Pro    | $3,996/mes|
| Optimista   | 2000  | 10% Pro + 3% Expert | $21,480/mes |

**Micropagos adicionales:** $0.99-$1.99 × conversiones del tier Free

**Comisiones de afiliados:** 15-20% del ingreso generado por cada código
→ Incentiva a ateliers a referir activamente (earn while you sleep 💤)
