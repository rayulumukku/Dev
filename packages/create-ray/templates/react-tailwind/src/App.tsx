import React, { useState } from 'react';
import './index.css';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-screen">
      <h1 className="text-4xl font-bold text-sky-400 mb-4">{{projectName}}</h1>
      <p className="text-slate-300 mb-6">React + Tailwind CSS template on Ray engine.</p>
      <button
        onClick={() => setCount((c) => c + 1)}
        className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg shadow-md transition"
      >
        Count: {count}
      </button>
    </div>
  );
}

export default App;
