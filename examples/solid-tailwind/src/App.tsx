import { createSignal } from 'solid-js';

export function App() {
  const [active, setActive] = createSignal(true);

  return (
    <div class="p-8 bg-sky-950 text-white rounded-lg shadow-2xl">
      <h1 class="text-3xl font-bold mb-4">Tailwind CSS + SolidJS</h1>
      <p class="text-sky-200">Fine-grained reactivity with utility styling.</p>
    </div>
  );
}
