import { createSignal } from 'solid-js';

export default function App() {
  const [count, setCount] = createSignal(0);
  return (
    <div>
      <h1>Hello Ray + Solid!</h1>
      <button onClick={() => setCount(count() + 1)}>Count: {count()}</button>
    </div>
  );
}
