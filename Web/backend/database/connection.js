import sql from 'mssql';

let poolPromise;

function readEnv(name, fallback = '', { trim = true } = {}) {
  const value = process.env[name] ?? fallback;
  return trim ? String(value).trim() : String(value);
}

function getConfig() {
  const server = readEnv('DB_SERVER', 'localhost');
  const instanceName = readEnv('DB_INSTANCE');
  const port = Number(readEnv('DB_PORT', '0'));
  const hasPort = Number.isFinite(port) && port > 0;
  const database = readEnv('DB_NAME');
  const user = readEnv('DB_USER');
  const password = readEnv('DB_PASS', '', { trim: false });
  const trustedConnection = readEnv('DB_TRUSTED_CONNECTION', 'false').toLowerCase() === 'true';

  // Nếu không có DB_USER thì bắt buộc phải dùng trusted connection
  if (!trustedConnection && !user) {
    const missing = [
      ['DB_NAME', database],
      ['DB_USER', user],
      ['DB_PASS', password.trim()]
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    throw new Error(
      `Missing SQL Server config: ${missing.join(', ')}. ` +
      'Create Web/backend/.env from Web/backend/.env.example and fill in your local SQL Server values.'
    );
  }

  if (!database) {
    throw new Error('Missing SQL Server config: DB_NAME.');
  }

  if (hasPort && instanceName) {
    throw new Error('Use either DB_PORT or DB_INSTANCE in Web/backend/.env, not both.');
  }

  const config = {
    server,
    port: hasPort ? port : undefined,
    database,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      trustedConnection,
      useUTC: false,
      ...(!hasPort && instanceName ? { instanceName } : {})
    }
  };

  // Chỉ thêm user/password khi không dùng Windows Auth
  if (!trustedConnection && user) {
    config.user = user;
    config.password = password;
  }

  return config;
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
