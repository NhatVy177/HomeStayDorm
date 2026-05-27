import { getSessionUser } from '../services/auth.service.js';

export async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const user = token ? await getSessionUser(token) : null;

    if (!user) {
      return res.status(401).json({ message: 'Vui long dang nhap de tiep tuc' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
