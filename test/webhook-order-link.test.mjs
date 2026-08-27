import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const route = readFileSync(
  new URL("../app/api/webhooks/flot/[merchantId]/route.ts", import.meta.url),
  "utf8"
)

test("webhook only links a customer order when Flot returns that exact order ID", () => {
  assert.doesNotMatch(
    route,
    /createdAt:\s*\{\s*gte:\s*thirtyMinAgo\s*\}|orderBy:\s*\{\s*createdAt:\s*["']desc["']\s*\}/s,
    "time-window matching can mark the wrong customer's order paid"
  )
  assert.match(
    route,
    /merchantId:\s*merchant\.id,\s*id:\s*orderId,/s,
    "the customer order lookup must stay merchant-scoped and use Flot's exact order ID"
  )
})
