-- Funde as permissões de criar e editar numa única permissão de salvar:
--   clients:create + clients:edit -> clients:save
--   orders:create  + orders:edit  -> orders:save
--
-- Os papéis guardam as chaves como texto em "Role"."permissions", então a
-- renomeação no catálogo (src/lib/rbac/permissions.ts) precisa ser refletida
-- aqui — senão quem já tinha a permissão perde o acesso.
--
-- ARRAY(SELECT ...) devolve array vazio (e não NULL) quando não há linhas,
-- ao contrário de array_agg; a coluna é NOT NULL.
UPDATE "public"."Role"
SET "permissions" = ARRAY(
  SELECT DISTINCT
    CASE p
      WHEN 'clients:create' THEN 'clients:save'
      WHEN 'clients:edit'   THEN 'clients:save'
      WHEN 'orders:create'  THEN 'orders:save'
      WHEN 'orders:edit'    THEN 'orders:save'
      ELSE p
    END
  FROM unnest("permissions") AS p
  ORDER BY 1
)
WHERE "permissions" && ARRAY[
  'clients:create',
  'clients:edit',
  'orders:create',
  'orders:edit'
];
