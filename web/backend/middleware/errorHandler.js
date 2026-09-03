import fs from 'fs';

export function errorHandler(err, req, res, next) {
  console.error(err);
  fs.appendFileSync('error_log.txt', new Date().toISOString() + '\n' + err.stack + '\n\n');
  res.status(err.statusCode || 500).json({
    message: err.message || 'Loi server'
  });
}
