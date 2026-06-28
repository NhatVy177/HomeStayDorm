import sql from 'mssql';

let poolPromise;

function getConfig() {
  const server = process.env.DB_SERVER || 'localhost';
  const instanceName = String(process.env.DB_INSTANCE || '').trim();
  const port = Number(process.env.DB_PORT || 0);
  const hasPort = Number.isFinite(port) && port > 0;

  return {
    server,
    port: hasPort ? port : undefined,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      ...(!hasPort && instanceName ? { instanceName } : {})
    }
  };
}

export function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(getConfig()).connect().catch((error) => {
      poolPromise = null;
      throw error;
    });
  }
  return poolPromise;
}

export async function executeProcedure(procedureName, parameters = []) {
  const pool = await getPool();
  const request = pool.request();

  for (const parameter of parameters) {
    request.input(parameter.name, parameter.type, parameter.value);
  }

  return request.execute(procedureName);
}

export async function executeQuery(sqlString, parameters = []) {
  const pool = await getPool();
  const request = pool.request();

  for (const parameter of parameters) {
    request.input(parameter.name, parameter.type, parameter.value);
  }

  return request.query(sqlString);
}

export { sql };
