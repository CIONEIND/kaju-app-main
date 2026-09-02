-- CreateTable
CREATE TABLE "EmailLabel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLabelMember" (
    "labelId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,

    CONSTRAINT "EmailLabelMember_pkey" PRIMARY KEY ("labelId","recipientId")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailLabel_name_key" ON "EmailLabel"("name");

-- AddForeignKey
ALTER TABLE "EmailLabelMember" ADD CONSTRAINT "EmailLabelMember_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "EmailLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLabelMember" ADD CONSTRAINT "EmailLabelMember_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "EmailRecipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
