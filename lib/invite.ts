import { Resend } from "resend"

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
    from: "Flot <noreply@flotme.ai>",
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
