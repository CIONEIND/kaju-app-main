-- CreateTable
CREATE TABLE "PurchaseOrderEmail" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "recipients" TEXT[],
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentBy" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrderEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailRecipient" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "label" TEXT,
    "useCount" INTEGER NOT NULL DEFAULT 1,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PurchaseOrderEmail_purchaseOrderId_idx" ON "PurchaseOrderEmail"("purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailRecipient_email_key" ON "EmailRecipient"("email");

-- AddForeignKey
ALTER TABLE "PurchaseOrderEmail" ADD CONSTRAINT "PurchaseOrderEmail_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
