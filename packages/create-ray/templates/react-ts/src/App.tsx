import React, { useState } from 'react';
import './global.css';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <h1>Welcome to {{projectName}} on Ray</h1>
      <p>Instant HMR and fast compilation.</p>
      <button onClick={() => setCount((c) => c + 1)}>
        Count: {count}
      </button>
    </div>
  );
}

export default App;
