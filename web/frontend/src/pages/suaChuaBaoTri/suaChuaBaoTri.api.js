import { httpClient } from '../../api/httpClient.js';

export const suaChuaBaoTriApi = {
  getAll: () => httpClient.get('/sua-chua-bao-tri'),
  create: (data) => httpClient.post('/sua-chua-bao-tri', data),
  tiepNhan: (id, data) => httpClient.put(`/sua-chua-bao-tri/${id}/tiep-nhan`, data),
  hoanTat: (id, data) => httpClient.put(`/sua-chua-bao-tri/${id}/hoan-tat`, data),
  tuChoi: (id, data) => httpClient.put(`/sua-chua-bao-tri/${id}/tu-choi`, data)
};
