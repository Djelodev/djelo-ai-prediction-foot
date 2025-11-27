const PAYSTACK_API_BASE = "https://api.paystack.co"

export type PaystackPlan = "pro" | "pro_max"

interface PaystackInitializeOptions {
  email: string
  amount: number
  currency: string
  reference: string
  callbackUrl: string
  metadata?: Record<string, unknown>
}

interface PaystackInitializeData {
  authorization_url: string
  access_code: string
  reference: string
  expires_at?: string
  message?: string
}

export interface PaystackVerifyData {
  status: string
  reference: string
  amount: number
  currency: string
  paid_at: string | null
  gateway_response?: string
  channel?: string
  metadata?: Record<string, unknown>
}

function getPaystackSecretKey() {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY n'est pas configurée. Ajoutez-la dans votre fichier .env.")
  }
  return secret
}

function parseAmount(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.round(parsed)
}

const DEFAULT_PLAN_PRICES_USD: Record<PaystackPlan, number> = {
  pro: 19,
  pro_max: 29,
}

export function getPaystackPlanConfig(plan: PaystackPlan) {
  const envKey = plan === "pro" ? "PAYSTACK_PLAN_PRO_AMOUNT" : "PAYSTACK_PLAN_PRO_MAX_AMOUNT"
  const fallbackMinor = Math.round(DEFAULT_PLAN_PRICES_USD[plan] * 100)
  const amount = parseAmount(process.env[envKey], fallbackMinor)
  const currency = (process.env.PAYSTACK_CURRENCY || "USD").toUpperCase()
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl

  return {
    amount,
    currency,
    callbackUrl: `${normalizedBaseUrl}/payments/paystack/callback`,
  }
}

export async function initializePaystackTransaction(
  options: PaystackInitializeOptions
): Promise<PaystackInitializeData> {
  const secret = getPaystackSecretKey()

  const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: options.email,
      amount: options.amount,
      currency: options.currency,
      callback_url: options.callbackUrl,
      reference: options.reference,
      metadata: options.metadata,
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.status) {
    const message = payload?.message || "Impossible d'initialiser le paiement Paystack"
    console.error("Paystack initialize error:", payload)
    throw new Error(message)
  }

  return payload.data as PaystackInitializeData
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyData> {
  const secret = getPaystackSecretKey()

  const response = await fetch(`${PAYSTACK_API_BASE}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.status) {
    const message = payload?.message || "Impossible de vérifier le paiement Paystack"
    console.error("Paystack verify error:", payload)
    throw new Error(message)
  }

  return payload.data as PaystackVerifyData
}

