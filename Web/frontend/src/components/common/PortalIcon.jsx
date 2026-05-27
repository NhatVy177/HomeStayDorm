import React from 'react';

export default function PortalIcon({ name }) {
  const shapes = {
    home: (
      <>
        <path d="M3.5 11.2 12 4l8.5 7.2" />
        <path d="M5.5 10.4V20h13v-9.6" />
        <path d="M9.5 20v-5.8h5V20" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    profile: (
      <>
        <path d="M7 3.8h7l3 3V20H7z" />
        <path d="M14 3.8v4h4" />
        <path d="M10 12h4M10 16h4" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5.5" width="16" height="14" rx="2" />
        <path d="M8 3.5v4M16 3.5v4M4 10h16M8 14h3" />
      </>
    ),
    support: (
      <>
        <path d="M5 5.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" />
        <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" />
      </>
    ),
    contract: (
      <>
        <path d="M7 3.8h7l3 3V20H7z" />
        <path d="M14 3.8v4h4M10 12h4M10 16h4" />
      </>
    ),
    payment: (
      <>
        <rect x="3.5" y="6" width="17" height="12" rx="2" />
        <path d="M3.5 10h17M7 14h4" />
      </>
    ),
    repair: (
      <>
        <path d="M14.5 6.2a4.2 4.2 0 0 0-5.2 5.2L4 16.7 7.3 20l5.3-5.3a4.2 4.2 0 0 0 5.2-5.2l-2.9 2.9-2.3-2.3z" />
      </>
    ),
    checkout: (
      <>
        <path d="M4.5 20h9V4h-9zM9 12h.01" />
        <path d="M13.5 12h7M17 8.5l3.5 3.5-3.5 3.5" />
      </>
    ),
    dashboard: (
      <>
        <path d="M4 13h7V4H4zM13 20h7v-9h-7zM4 20h7v-5H4zM13 9h7V4h-7z" />
      </>
    ),
    list: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </>
    ),
    deposit: (
      <>
        <path d="M4 7h16v12H4zM16 7V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2M12 11v4M10 13h4" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    building: (
      <>
        <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 13v.01M9 17v.01" />
      </>
    ),
    asset: (
      <>
        <path d="m21 8-9-5-9 5 9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8M12 13v8" />
      </>
    )
  };

  return (
    <svg className="portal-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {shapes[name] || shapes.home}
    </svg>
  );
}
