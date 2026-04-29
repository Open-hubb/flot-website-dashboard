-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MerchantType" AS ENUM ('QR_ONLY', 'WEBSITE');

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "type" "MerchantType" NOT NULL DEFAULT 'QR_ONLY',
    "flotMerchantId" TEXT NOT NULL,
    "webhookUsername" TEXT NOT NULL DEFAULT '',
    "webhookPassword" TEXT NOT NULL DEFAULT '',
    "inviteToken" TEXT,
    "inviteExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "flotRequestId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentType" TEXT,
    "amount" DECIMAL(18,2),
    "currency" TEXT,
    "rawPayload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPrefs" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "emailDigest" BOOLEAN NOT NULL DEFAULT true,
    "digestFreq" TEXT NOT NULL DEFAULT 'DAILY',
    "newOrderAlert" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPrefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InAppNotification" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_email_key" ON "Merchant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_flotMerchantId_key" ON "Merchant"("flotMerchantId");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_inviteToken_key" ON "Merchant"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderId_key" ON "Order"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_flotRequestId_key" ON "Order"("flotRequestId");

-- CreateIndex
CREATE INDEX "Order_merchantId_idx" ON "Order"("merchantId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_receivedAt_idx" ON "Order"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPrefs_merchantId_key" ON "NotificationPrefs"("merchantId");

-- CreateIndex
CREATE INDEX "InAppNotification_merchantId_read_idx" ON "InAppNotification"("merchantId", "read");

-- CreateIndex
CREATE INDEX "WebsiteAnalyticsEvent_merchantId_createdAt_idx" ON "WebsiteAnalyticsEvent"("merchantId", "createdAt");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPrefs" ADD CONSTRAINT "NotificationPrefs_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteAnalyticsEvent" ADD CONSTRAINT "WebsiteAnalyticsEvent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
