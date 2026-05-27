import React from 'react';
import { getStatusLabel } from '../../constants/status.js';

export default function StatusBadge({ status }) {
  return <span className="status-badge">{getStatusLabel(status)}</span>;
}
