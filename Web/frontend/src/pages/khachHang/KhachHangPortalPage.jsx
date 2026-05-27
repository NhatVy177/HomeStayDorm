import React, { useEffect, useState } from 'react';
import KhachDangThuePage from '../khachDangThue/KhachDangThuePage.jsx';
import KhachMoiPage from '../khachMoi/KhachMoiPage.jsx';
import { khachMoiApi } from '../khachMoi/khachMoi.api.js';

export default function KhachHangPortalPage() {
  const [state, setState] = useState({ loading: true, laKhachMoi: null, error: '' });

  useEffect(() => {
    let active = true;

    khachMoiApi.getTrangThai()
      .then(({ data }) => {
        if (active) {
          setState({ loading: false, laKhachMoi: Boolean(data?.laKhachMoi), error: '' });
        }
      })
      .catch((requestError) => {
        if (active) {
          setState({
            loading: false,
            laKhachMoi: null,
            error: requestError.response?.data?.message || 'Không thể xác định trạng thái khách hàng.'
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.loading) {
    return <div className="auth-loading">Đang xác định cổng khách hàng...</div>;
  }

  if (state.error) {
    return <div className="auth-loading">{state.error}</div>;
  }

  return state.laKhachMoi ? <KhachMoiPage /> : <KhachDangThuePage />;
}
