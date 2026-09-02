ALTER TABLE "PurchaseOrder"
ADD COLUMN "orderStatus" TEXT NOT NULL DEFAULT 'Rascunho',
ADD COLUMN "financialStatus" TEXT NOT NULL DEFAULT 'Aguardando pagamento',
ADD COLUMN "stockStatus" TEXT NOT NULL DEFAULT 'Estoque não reservado';

UPDATE "PurchaseOrder"
SET
  "orderStatus" = CASE
    WHEN "status" = 'Rascunho' THEN 'Rascunho'
    WHEN "status" = 'Cancelado' THEN 'Cancelado'
    ELSE 'Confirmado'
  END,
  "financialStatus" = CASE
    WHEN "status" = 'Pago' THEN 'Pago'
    ELSE 'Aguardando pagamento'
  END,
  "stockStatus" = CASE
    WHEN "status" = 'Entregue/Retirado' THEN 'Mercadoria retirada'
    WHEN "reserved" = true THEN 'Estoque reservado'
    ELSE 'Estoque não reservado'
  END;

ALTER TABLE "PurchaseOrder"
DROP COLUMN "status",
DROP COLUMN "reserved";
