"use client";
import React, { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="counter-box">
      <button onClick={() => setCount(count + 1)}>
        Client Counter: {count}
      </button>
    </div>
  );
}
