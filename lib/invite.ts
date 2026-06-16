import { Resend } from "resend"
import { APP_URL } from "@/lib/app-url"

export async function sendInviteEmail({
  email,
  name,
  businessName,
  token,
}: {
  email: string
  name: string
  businessName: string
  token: string
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"
  const inviteUrl = `${appUrl}/set-password?token=${token}`

  const result = await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "Flot <noreply@flotme.ai>",
    to: email,
    subject: "You've been invited to the Flot Merchant Dashboard",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <div style="margin-bottom:32px">
          <span style="font-size:28px;font-weight:700;color:#111">flot</span><span style="font-size:28px;font-weight:700;color:#80ffdd">.</span>
        </div>
        <h1 style="font-size:20px;font-weight:600;margin:0 0 8px">Welcome to Flot, ${name}!</h1>
        <p style="color:#555;margin:0 0 24px">
          Your merchant account for <strong>${businessName}</strong> has been created.
          Click the button below to set your password and access your dashboard.
        </p>
        <a href="${inviteUrl}"
           style="display:inline-block;background:#80ffdd;color:#111;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;margin-bottom:24px">
          Set up my account
        </a>
        <p style="color:#999;font-size:13px;margin:0">
          This link expires in 7 days. If you weren't expecting this email, you can ignore it.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#bbb;font-size:12px;margin:0">
          Or copy this link: ${inviteUrl}
        </p>
      </div>
    `,
  })

  const { error } = result ?? {}
  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`)
  }
}

export async function sendPasswordResetEmail({
  email,
  name,
  token,
}: {
  email: string
  name: string
  token: string
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const resetUrl = `${APP_URL}/set-password?token=${token}&reset=1`

  const result = await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "Flot <noreply@flotme.ai>",
    to: email,
    subject: "Reset your Flot Merchant Dashboard password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <div style="margin-bottom:32px">
          <span style="font-size:28px;font-weight:700;color:#111">flot</span><span style="font-size:28px;font-weight:700;color:#80ffdd">.</span>
        </div>
        <h1 style="font-size:20px;font-weight:600;margin:0 0 8px">Reset your password</h1>
        <p style="color:#555;margin:0 0 24px">
          Hi ${name}, we received a request to reset the password for your Flot dashboard.
          Click the button below to choose a new one.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#80ffdd;color:#111;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;margin-bottom:24px">
          Reset my password
        </a>
        <p style="color:#999;font-size:13px;margin:0">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#bbb;font-size:12px;margin:0">
          Or copy this link: ${resetUrl}
        </p>
      </div>
    `,
  })

  const { error } = result ?? {}
  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`)
  }
}
