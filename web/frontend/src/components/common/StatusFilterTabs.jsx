import React from 'react';

export default function StatusFilterTabs({
  items,
  activeKey,
  onChange,
  counts,
  ariaLabel = 'Bộ lọc trạng thái',
  className = ''
}) {
  return (
    <div className={`status-pill-tabs ${className}`.trim()} role="group" aria-label={ariaLabel}>
      {items.map((item) => {
        const isActive = activeKey === item.key;
        const count = item.count ?? counts?.[item.key];

        return (
          <button
            key={item.key || 'all'}
            type="button"
            aria-pressed={isActive}
            className={`status-pill-tab${isActive ? ' is-active' : ''}`}
            onClick={() => onChange(item.key)}
          >
            <span className="status-pill-label">{item.label}</span>
            {count !== undefined && count !== null && (
              <span className="status-pill-count">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
