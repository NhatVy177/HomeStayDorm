import React from 'react';
import './SoNguoiBadge.css';

// Icon tự chứa để component dùng được ở mọi trang mà không phụ thuộc bộ Icon riêng.
const IconGroup = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconPerson = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

// Chip "Số người" + tooltip chi tiết số nam/số nữ (hover để xem).
export default function SoNguoiBadge({ soNguoi, soNam = 0, soNu = 0, khacGioi = false }) {
  const nam = Number(soNam) || 0;
  const nu = Number(soNu) || 0;
  const tong = Number(soNguoi) || nam + nu;
  return (
    <span className="kp-people">
      <span className={`kp-people-chip${khacGioi ? ' is-mixed' : ''}`}>
        <IconGroup />
        <span>{tong}</span>
        {khacGioi && <span className="kp-people-warn" title="Nhóm khác giới" />}
      </span>
      <span className="kp-people-tip">
        <span className="kp-people-tip-inner">
          <span className="kp-people-tip-title">Chi tiết ({tong} người)</span>
          <span className="kp-people-tip-row">
            {nam > 0 && (
              <span className="kp-gender-pill kp-gender-nam">
                <IconPerson /><span>{nam} Nam</span>
              </span>
            )}
            {nu > 0 && (
              <span className="kp-gender-pill kp-gender-nu">
                <IconPerson /><span>{nu} Nữ</span>
              </span>
            )}
            {nam === 0 && nu === 0 && (
              <span className="kp-gender-pill"><span>Chưa rõ cơ cấu</span></span>
            )}
          </span>
        </span>
        <span className="kp-people-tip-arrow" />
      </span>
    </span>
  );
}
