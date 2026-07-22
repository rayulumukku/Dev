import { createSignal } from 'solid-js';

export function App() {
  const [count, setCount] = createSignal(0);

  return (
    <div style="font-family: sans-serif; padding: 2rem; text-align: center;">
      <h1>SolidJS Basic App with Ray</h1>
      <button onClick={() => setCount(count() + 1)}>
        Count: {count()}
      </button>
    </div>
  );
}
