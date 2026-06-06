-- CreateEnum
CREATE TYPE "CmsPageStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "CmsPage" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "draftContent" JSONB NOT NULL,
    "publishedContent" JSONB,
    "status" "CmsPageStatus" NOT NULL DEFAULT 'DRAFT',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "CmsPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsMedia" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CmsMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CmsPage_merchantId_idx" ON "CmsPage"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "CmsPage_merchantId_slug_key" ON "CmsPage"("merchantId", "slug");

-- CreateIndex
CREATE INDEX "CmsMedia_merchantId_idx" ON "CmsMedia"("merchantId");

-- AddForeignKey
ALTER TABLE "CmsPage" ADD CONSTRAINT "CmsPage_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CmsMedia" ADD CONSTRAINT "CmsMedia_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
