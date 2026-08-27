import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const route = readFileSync(
  new URL("../app/api/webhooks/flot/[merchantId]/route.ts", import.meta.url),
  "utf8"
)

test("duplicate webhook handling never queries an aborted transaction", () => {
  assert.doesNotMatch(
    route,
    /tx\.order\.create\([\s\S]*?catch \(error\)[\s\S]*?tx\.order\.findFirst/,
    "a unique-constraint error aborts a PostgreSQL transaction, so duplicate handling must not query through that transaction"
  )
  assert.match(
    route,
    /await db\.order\.create\([\s\S]*?completionRecorded = true[\s\S]*?catch \(error\)[\s\S]*?if \(!isUniqueViolation\(error\)\) throw error/,
    "a competing delivery must be treated as already processed without emitting a second notification"
  )
})
