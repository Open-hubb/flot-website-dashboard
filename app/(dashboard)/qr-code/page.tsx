import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Download, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"

export default async function QrCodePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const merchant = await db.merchant.findUnique({
    where: { id: session.user.id },
    select: { flotMerchantId: true, businessName: true },
  })
  if (!merchant) redirect("/login")

  const paymentUrl = `https://pay.flotme.ai/${merchant.flotMerchantId}`
  const qrSrc = `/api/qr?data=${encodeURIComponent(paymentUrl)}`

  return (
    <div className="space-y-6">
      <div className="max-w-sm">
        <div className="rounded-xl border bg-card p-8 shadow-sm text-center">
          <h2 className="text-lg font-semibold">{merchant.businessName}</h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            Customers scan this QR code to pay via Flot
          </p>

          {/* QR Code */}
          <div className="mx-auto w-fit rounded-xl border-4 border-white shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt={`Payment QR code for ${merchant.businessName}`}
              width={256}
              height={256}
              className="rounded-lg"
            />
          </div>

          {/* URL */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <p className="max-w-[200px] truncate text-xs font-mono text-muted-foreground">
              {paymentUrl}
            </p>
            <CopyButton value={paymentUrl} />
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-center gap-3">
            <a href={qrSrc} download={`${merchant.businessName.replace(/\s+/g, "-")}-qr.png`}>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download PNG
              </Button>
            </a>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">How to use</p>
          <ul className="mt-2 list-disc pl-4 space-y-1">
            <li>Print the QR code and display it at your payment counter</li>
            <li>Customers scan with their phone camera to pay</li>
            <li>You&apos;ll get a notification when payment is received</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
