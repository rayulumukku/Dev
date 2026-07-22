import React, { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button
      onClick={() => setCount(c => c + 1)}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        background: '#6366f1',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'bold',
      }}
    >
      Count: {count}
    </button>
  );
}
