import React from 'react';

export interface CalloutProps {
  type?: 'info' | 'warning' | 'success';
  children: React.ReactNode;
}

export function Callout({ type = 'info', children }: CalloutProps) {
  const colors = {
    info: '#6366f1',
    warning: '#f59e0b',
    success: '#10b981',
  };

  return (
    <div
      style={{
        padding: '1rem',
        borderRadius: '8px',
        borderLeft: `4px solid ${colors[type] || colors.info}`,
        background: 'rgba(255, 255, 255, 0.05)',
        margin: '1rem 0',
      }}
    >
      {children}
    </div>
  );
}
