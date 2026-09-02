/*
  Warnings:

  - You are about to drop the column `productName` on the `PurchaseOrderItem` table. All the data in the column will be lost.
  - Changed the type of `productId` on the `PurchaseOrderItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "dbo"."TbCli" ALTER COLUMN "Timestamp" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "reserved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PurchaseOrderItem" DROP COLUMN "productName",
DROP COLUMN "productId",
ADD COLUMN     "productId" INTEGER NOT NULL;
