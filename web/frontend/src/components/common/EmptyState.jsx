import React from 'react';
export default function EmptyState({ message = 'Chưa có dữ liệu' }) {
  return <div className="empty-state">{message}</div>;
}
