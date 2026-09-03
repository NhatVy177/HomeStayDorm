const LOCKED_ROOMS_KEY = 'homedorm.admin.lockedRooms.v1';

function readLockedRoomIds() {
  if (typeof window === 'undefined' || !window.localStorage) return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCKED_ROOMS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function getLockedRoomIds() {
  return readLockedRoomIds();
}

export function isRoomLocked(roomId) {
  const normalizedId = String(roomId || '').trim();
  return normalizedId ? readLockedRoomIds().includes(normalizedId) : false;
}

export function setRoomLocked(roomId, locked) {
  const normalizedId = String(roomId || '').trim();
  if (!normalizedId || typeof window === 'undefined' || !window.localStorage) {
    return readLockedRoomIds();
  }

  const nextIds = new Set(readLockedRoomIds());
  if (locked) {
    nextIds.add(normalizedId);
  } else {
    nextIds.delete(normalizedId);
  }

  const next = Array.from(nextIds);
  window.localStorage.setItem(LOCKED_ROOMS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('homedorm:locked-rooms-change', { detail: next }));
  return next;
}

export function filterUnlockedRooms(rooms, getId = (room) => room.maPhong || room.MaPhong) {
  const lockedIds = new Set(readLockedRoomIds());
  return (rooms || []).filter((room) => !lockedIds.has(String(getId(room) || '').trim()));
}

