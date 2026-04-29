import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get("data")
  if (!data) return NextResponse.json({ error: "data param required" }, { status: 400 })

  try {
    const buffer = await QRCode.toBuffer(data, {
      width: 400,
      margin: 2,
      color: { dark: "#000000ff", light: "#ffffffff" },
    })
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "QR generation failed" }, { status: 500 })
  }
}
