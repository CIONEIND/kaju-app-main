import React from 'react';

import { topManagerProducao } from '@/lib/top-manager/db/knex-top-manager-producao';

const TestSqlServerPage = async () => {
    const clients = await topManagerProducao.raw('SELECT * FROM dbo.TbCli tc');
  return (
    <div>{JSON.stringify(clients, null ,2)}</div>
  )
}

export default TestSqlServerPage