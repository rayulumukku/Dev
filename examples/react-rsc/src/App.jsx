import React from 'react';
import { Counter } from './Counter.jsx';

export function App() {
  const serverTime = new Date().toISOString();

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
      <h1>React Server Components (RSC) with Ray</h1>
      <p>Server Time: {serverTime}</p>
      <Counter />
    </div>
  );
}
