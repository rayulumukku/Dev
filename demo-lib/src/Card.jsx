import React from 'react';

export function Card({ title, children }) {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', margin: '8px 0' }}>
      <h3 style={{ margin: '0 0 8px 0' }}>{title}</h3>
      {children}
    </div>
  );
}
