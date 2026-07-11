import { sql } from '../database/connection.js';

function requestFrom(db) {
  return typeof db.request === 'function' ? db.request() : new sql.Request(db);
}

export async function execute(db, procedureName, parameters = []) {
  const request = requestFrom(db);

  for (const parameter of parameters) {
    request.input(parameter.name, parameter.type, parameter.value);
  }

  return request.execute(procedureName);
}
