import React from 'react';

export function Modal({ isOpen, title, children, onClose }) {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', minWidth: '300px', color: '#333' }}>
        <h3 style={{ margin: '0 0 12px 0' }}>{title}</h3>
        <div>{children}</div>
        <button onClick={onClose} style={{ marginTop: '16px', padding: '6px 12px', cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </div>
  );
}
