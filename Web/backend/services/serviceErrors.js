export function createServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function mapDatabaseError(error, statusMap = {}) {
  if (error && typeof error.number === 'number' && statusMap[error.number]) {
    throw createServiceError(error.message, statusMap[error.number]);
  }

  throw error;
}