import React, { useState } from 'react';
import './index.css';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-between p-4 bg-slate-900 text-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold">React + Tailwind CSS on Ray</h1>
      <p className="mt-2">Count: {count}</p>
      <button
        onClick={() => setCount((c) => c + 1)}
        className="px-4 py-2 bg-brand text-white rounded hover:bg-sky-600 transition"
      >
        Increment
      </button>
    </div>
  );
}

export default App;
