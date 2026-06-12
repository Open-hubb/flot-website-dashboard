import { NextRequest, NextResponse } from "next/server"
import { APP_URL } from "@/lib/app-url"

export async function GET(req: NextRequest) {
  const merchantId = req.nextUrl.searchParams.get("id") ?? ""

  const script = `
(function() {
  var mid = ${JSON.stringify(merchantId)};
  if (!mid) return;
  try {
    fetch("${APP_URL}/api/public/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantId: mid,
        page: window.location.pathname,
        referrer: document.referrer || null,
      }),
    });
  } catch(e) {}
})();
`.trim()

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
