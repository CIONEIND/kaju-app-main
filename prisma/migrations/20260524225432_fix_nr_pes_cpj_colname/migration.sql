/*
  Warnings:

  - You are about to drop the column `nrPesCpf` on the `TbCli` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "dbo"."TbCli" DROP COLUMN "nrPesCpf",
ADD COLUMN     "NrPesCpj" TEXT;
