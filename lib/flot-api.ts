const FLOT_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.app.flotme.ai"
    : "https://api.stage.flotme.ai"

export type PaymentType = "card" | "in-app" | "momo"

export interface PaymentLinkRequest {
  merchantId: string
  type: PaymentType
  payload: {
    orderId: string
    amount: string
    currency: string
  }
}

export interface PaymentLinkResponse {
  data: {
    link: string | null
    code: string | null
  }
}

export async function createPaymentLink(
  body: PaymentLinkRequest,
  signature: string
): Promise<PaymentLinkResponse> {
  const res = await fetch(`${FLOT_BASE_URL}/merchants/private/v1/payment-links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Flot-Merchant-Signature": signature,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(`Flot API error ${res.status}: ${JSON.stringify(error)}`)
  }

  return res.json()
}
