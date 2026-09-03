import { executeQuery, sql } from '../database/connection.js';
import { createServiceError } from './serviceErrors.js';

export function normalizeSingleRoomType(value) {
  const roomTypes = String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (roomTypes.length === 0) {
    throw createServiceError('Vui lòng chọn một loại phòng mong muốn.');
  }
  if (roomTypes.length > 1) {
    throw createServiceError('Phiếu đăng ký chỉ được chọn một loại phòng mong muốn.');
  }

  return roomTypes[0];
}

export async function assertSingleRoomTypeCapacity(roomTypeValue, occupantCount) {
  const roomType = normalizeSingleRoomType(roomTypeValue);
  const soNguoiO = Number(occupantCount);

  if (!Number.isInteger(soNguoiO) || soNguoiO < 1) {
    throw createServiceError('Vui lòng nhập số người dự kiến ở hợp lệ.');
  }

  const result = await executeQuery(`
    SELECT TOP (1) SucChuaToiDa
    FROM dbo.LoaiPhong
    WHERE TenLoaiPhong = @TenLoaiPhong;
  `, [
    { name: 'TenLoaiPhong', type: sql.NVarChar(100), value: roomType }
  ]);

  const capacity = Number(result.recordset[0]?.SucChuaToiDa || 0);
  if (!capacity) {
    throw createServiceError('Loại phòng mong muốn không hợp lệ.');
  }
  if (soNguoiO > capacity) {
    throw createServiceError(`Số người ở dự kiến không được vượt quá ${capacity} người của loại phòng ${roomType}.`);
  }

  return roomType;
}
