export function createServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// SQL Server THROW messages qua tedious driver đôi khi bị encode sai (Latin-1 thay vì UTF-8).
// Fix: re-encode từ latin1 → utf8 để tiếng Việt hiển thị đúng.
function fixEncoding(str) {
  try {
    const fixed = Buffer.from(str, 'latin1').toString('utf8');
    // Kiểm tra kết quả có hợp lệ UTF-8 không (nếu không thì giữ nguyên)
    return /\uFFFD/.test(fixed) ? str : fixed;
  } catch {
    return str;
  }
}

export function mapDatabaseError(error, statusMap = {}) {
  if (error && typeof error.number === 'number' && statusMap[error.number]) {
    throw createServiceError(fixEncoding(error.message), statusMap[error.number]);
  }

  throw error;
}