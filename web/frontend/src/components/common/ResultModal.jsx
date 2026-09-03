import React, { useEffect } from 'react';
import './resultModal.css';

// Máy bay giấy đang bay - dùng cho thông báo thành công.
function PaperPlane() {
  return (
    <svg viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* vệt bay */}
      <path d="M8 96 C 34 90, 48 80, 60 64" stroke="#9ec9f7" strokeWidth="3"
        strokeLinecap="round" strokeDasharray="2 9" />
      {/* thân máy bay */}
      <polygon points="14,58 132,12 78,108 64,72" fill="#ffffff" stroke="#5b6b7b" strokeWidth="2.2" strokeLinejoin="round" />
      {/* cánh dưới (mặt gấp tối hơn) */}
      <polygon points="132,12 64,72 78,108" fill="#dbe7f6" stroke="#5b6b7b" strokeWidth="2.2" strokeLinejoin="round" />
      {/* nếp gấp giữa */}
      <line x1="132" y1="12" x2="64" y2="72" stroke="#5b6b7b" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// Máy bay giấy cắm đầu xuống đất - dùng cho thông báo thất bại.
function CrashedPlane() {
  return (
    <svg viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* bóng đổ dưới đất */}
      <ellipse cx="70" cy="104" rx="34" ry="7" fill="#f3a9ab" />
      {/* máy bay cắm mũi xuống */}
      <g transform="rotate(168 70 60)">
        <polygon points="20,52 128,18 80,104 66,70" fill="#ffffff" stroke="#9b4a4d" strokeWidth="2.2" strokeLinejoin="round" />
        <polygon points="128,18 66,70 80,104" fill="#fbe0e1" stroke="#9b4a4d" strokeWidth="2.2" strokeLinejoin="round" />
        <line x1="128" y1="18" x2="66" y2="70" stroke="#9b4a4d" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/**
 * Popup thông báo kết quả thao tác.
 * @param {boolean} open      - hiển thị hay không
 * @param {'success'|'error'} type
 * @param {string} title
 * @param {string} message
 * @param {string} [confirmText]
 * @param {() => void} onClose
 */
export default function ResultModal({ open, type = 'success', title, message, confirmText, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isSuccess = type === 'success';
  const heading = title || (isSuccess ? 'Thành công!' : 'Đã có lỗi.');
  const btnText = confirmText || (isSuccess ? 'Tiếp tục' : 'Thử lại');

  return (
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-card" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <div className={`rm-art rm-art--${isSuccess ? 'success' : 'error'}`}>
          <div className="rm-hill" />
          {isSuccess ? <PaperPlane /> : <CrashedPlane />}
        </div>

        <button className="rm-close" onClick={onClose} aria-label="Đóng">×</button>

        <div className="rm-body">
          <h3 className="rm-title">{heading}</h3>
          {/* Không có message thì bỏ luôn thẻ <p>, tránh để lại khoảng trống thừa */}
          {message ? <p className="rm-msg">{message}</p> : null}
          <button className={`rm-btn rm-btn--${isSuccess ? 'success' : 'error'}`} onClick={onClose}>
            {btnText}
          </button>
        </div>
      </div>
    </div>
  );
}
