-- Renomeia os status de exibição gravados nos pedidos existentes.
UPDATE "PurchaseOrder" SET "orderStatus" = 'Orçamento' WHERE "orderStatus" = 'Rascunho';
UPDATE "PurchaseOrder" SET "stockStatus" = 'Produtos retirados' WHERE "stockStatus" = 'Mercadoria retirada';

-- Atualiza o default da coluna de status do pedido.
ALTER TABLE "PurchaseOrder" ALTER COLUMN "orderStatus" SET DEFAULT 'Orçamento';
