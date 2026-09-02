/*
  Warnings:

  - Added the required column `updatedAt` to the `TbCli` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dbo"."TbCli" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registeredInV2" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
