const SESSION_KEY = 'happyroom_session';
const SESSION_VERSION = 2; // Tăng số này khi cần force logout toàn bộ user (vd: đổi encoding)

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Nếu version không khớp → xóa session cũ, bắt đăng nhập lại
    if (!parsed || parsed._v !== SESSION_VERSION) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function getStoredToken() {
  return getStoredSession()?.token || '';
}

export function storeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, _v: SESSION_VERSION }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
