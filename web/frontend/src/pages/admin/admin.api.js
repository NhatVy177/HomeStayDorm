import { httpClient } from '../../api/httpClient.js';

export const adminApi = {
  getBranches: (params) => httpClient.get('/admin/branches', { params }),
  createBranch: (data) => httpClient.post('/admin/branches', data),
  updateBranch: (id, data) => httpClient.put(`/admin/branches/${id}`, data),
  deleteBranch: (id) => httpClient.delete(`/admin/branches/${id}`),
  getRoomTypes: (params) => httpClient.get('/admin/room-types', { params }),
  getRooms: (params) => httpClient.get('/admin/rooms', { params }),
  createRoomBeds: (data) => httpClient.post('/admin/rooms', data),
  updateRoom: (id, data) => httpClient.put(`/admin/rooms/${id}`, data),
  deleteRoom: (id) => httpClient.delete(`/admin/rooms/${id}`),
  updateRoomStatus: (id, trangThai) => httpClient.patch(`/admin/rooms/${id}/status`, { trangThai }),
  // Giai Ä‘oáº¡n 1: NhĂ¢n viĂªn
  getEmployees: (params) => httpClient.get('/admin/employees', { params }),
  getNextEmployeeId: () => httpClient.get('/admin/employees/next-id'),
  getEmployee: (id) => httpClient.get(`/admin/employees/${id}`),
  createEmployee: (data) => httpClient.post('/admin/employees', data),
  lockUnlockEmployee: (id, isLocked) => httpClient.patch(`/admin/employees/${id}/lock`, { isLocked }),
  assignRole: (id, data) => httpClient.patch(`/admin/employees/${id}/role`, data),
  updateEmployee: (id, data) => httpClient.put(`/admin/employees/${id}`, data),

  // Quy Ä‘á»‹nh váº­n hĂ nh
  getServices: (params) => httpClient.get('/admin/services', { params }),
  createService: (data) => httpClient.post('/admin/services', data),
  updateService: (id, data) => httpClient.put(`/admin/services/${id}`, data),
  deleteService: (id) => httpClient.delete(`/admin/services/${id}`),

  getRefundRules: (params) => httpClient.get('/admin/refund-rules', { params }),
  createRefundRule: (data) => httpClient.post('/admin/refund-rules', data),
  updateRefundRule: (id, data) => httpClient.put(`/admin/refund-rules/${id}`, data),
  deleteRefundRule: (id) => httpClient.delete(`/admin/refund-rules/${id}`),

  getRules: (params) => httpClient.get('/admin/rules', { params }),
  createRule: (data) => httpClient.post('/admin/rules', data),
  updateRule: (id, data) => httpClient.put(`/admin/rules/${id}`, data),
  deleteRule: (id) => httpClient.delete(`/admin/rules/${id}`),

  getViolations: (params) => httpClient.get('/admin/violations', { params }),
  createViolation: (data) => httpClient.post('/admin/violations', data),
  updateViolation: (id, data) => httpClient.put(`/admin/violations/${id}`, data),
  deleteViolation: (id) => httpClient.delete(`/admin/violations/${id}`),

  // Cáº¥u hĂ¬nh há»‡ thá»‘ng
  getSettings: () => httpClient.get('/admin/settings'),
  updateSettings: (data) => httpClient.put('/admin/settings', data),

  // Quáº£n lĂ½ giÆ°á»ng
  getRoomBeds: (roomId, params) => httpClient.get(`/admin/rooms/${roomId}/beds`, { params }),
  createRoomBed: (roomId, data) => httpClient.post(`/admin/rooms/${roomId}/beds`, data),
  updateRoomBed: (roomId, bedId, data) => httpClient.put(`/admin/rooms/${roomId}/beds/${bedId}`, data),
  deleteRoomBed: (roomId, bedId) => httpClient.delete(`/admin/rooms/${roomId}/beds/${bedId}`),

  // Quáº£n lĂ½ tĂ i sáº£n phĂ²ng
  getRoomAssets: (roomId, params) => httpClient.get(`/admin/rooms/${roomId}/assets`, { params }),
  createRoomAsset: (roomId, data) => httpClient.post(`/admin/rooms/${roomId}/assets`, data),
  updateRoomAsset: (roomId, assetId, data) => httpClient.put(`/admin/rooms/${roomId}/assets/${assetId}`, data),
  deleteRoomAsset: (roomId, assetId) => httpClient.delete(`/admin/rooms/${roomId}/assets/${assetId}`),

  // Sao lÆ°u dá»¯ liá»‡u
  getBackups: (params) => httpClient.get('/admin/backups', { params }),
  createBackup: (data) => httpClient.post('/admin/backups/manual', data),
  restoreBackup: (id, data) => httpClient.post(`/admin/backups/${id}/restore`, data),

  // Nhật ký hệ thống
  getLogs: (params) => httpClient.get('/admin/logs', { params })
};
