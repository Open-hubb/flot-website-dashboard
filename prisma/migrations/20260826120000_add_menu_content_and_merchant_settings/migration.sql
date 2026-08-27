-- Bring the database schema in line with the menu API and dashboard settings.
ALTER TABLE "Merchant"
  ADD COLUMN "disabledTabs" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "siteUrl" TEXT;

CREATE TABLE "MenuContent" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MenuContent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MenuContent_merchantId_key" ON "MenuContent"("merchantId");

ALTER TABLE "MenuContent"
  ADD CONSTRAINT "MenuContent_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
