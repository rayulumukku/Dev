import React, { useState } from 'react';

export const App = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <h1>Hello Ray + React!</h1>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
    </div>
  );
};
