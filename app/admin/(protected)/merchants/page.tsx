import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { formatDateTime } from "@/lib/format"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { ResendInviteButton, DeleteMerchantButton } from "./merchant-actions"

export default async function MerchantsPage() {
  await requireAdmin()

  const merchants = await db.merchant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      type: true,
      flotMerchantId: true,
      inviteToken: true,
      inviteExpiry: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Merchants</h1>
          <p className="text-sm text-muted-foreground mt-1">{merchants.length} total</p>
        </div>
        <Link href="/admin/merchants/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Invite Merchant
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Merchant</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Flot ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Orders</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {merchants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No merchants yet. Invite one to get started.
                </td>
              </tr>
            ) : (
              merchants.map((m) => {
                const invitePending = !!m.inviteToken
                const inviteExpired =
                  m.inviteExpiry && m.inviteExpiry < new Date()

                return (
                  <tr key={m.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{m.businessName}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {m.type === "WEBSITE" ? "Website" : "QR Only"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {m.flotMerchantId}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m._count.orders}</td>
                    <td className="px-4 py-3">
                      {invitePending ? (
                        <Badge variant={inviteExpired ? "destructive" : "secondary"}>
                          {inviteExpired ? "Invite expired" : "Invite pending"}
                        </Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDateTime(m.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <ResendInviteButton merchantId={m.id} email={m.email} />
                        <DeleteMerchantButton merchantId={m.id} businessName={m.businessName} />
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
