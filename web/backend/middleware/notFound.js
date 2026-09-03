export function notFound(req, res, next) {
  res.status(404).json({ message: 'Khong tim thay API' });
}
