if (!import.meta.hot) {
  import.meta.hot = (typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : globalThis).__ray_create_hot_context?.(import.meta.url);
}
import React, { useState, useEffect } from 'react';
import Layout from './app/layout.jsx';
import Page from './app/page.jsx';
import MDXContent, { frontmatter } from './doc.mdx';
import styles from './styles.module.css';
import loadWasm from './math.wasm';
export async function loader() {
  return { message: "Hello from Remix Loader!" };
}
export default function App() {
  const [remixMessage, setRemixMessage] = useState('');
  const [workerResult, setWorkerResult] = useState(null);
  const [wasmResult, setWasmResult] = useState(null);
  useEffect(() => {
    loader().then(data => setRemixMessage(data.message));
  }, []);
  useEffect(() => {
    try {
      const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = e => {
        setWorkerResult(e.data.result);
      };
      worker.postMessage({ val: 21 });
    } catch (err) {
      console.error('Failed to initialize Web Worker:', err);
    }
  }, []);
  useEffect(() => {
    loadWasm().then(exports => {
      if (exports && typeof exports.add === 'function') {
        setWasmResult(exports.add(10, 32));
      }
    }).catch(err => {
      console.error('Failed to load WASM:', err);
    });
  }, []);
  return React.createElement("div", { className: "p-8 max-w-2xl mx-auto space-y-6" }, React.createElement("h1", { className: "text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-500" }, "\n        Ecosystem Verification App\n      "), React.createElement("section", { className: "bg-gray-800/40 p-4 rounded-xl border border-gray-700/50" }, React.createElement("h2", { className: "text-xl font-bold text-gray-200 mb-2" }, "React & Next.js Routing"), React.createElement(Layout, null, React.createElement(Page, null))), React.createElement("section", { className: "bg-gray-800/40 p-4 rounded-xl border border-gray-700/50" }, React.createElement("h2", { className: "text-xl font-bold text-gray-200 mb-2" }, "Remix Loaders"), React.createElement("div", { className: "remix-loader-msg text-emerald-400" }, remixMessage || 'Loading remix message...')), React.createElement("section", { className: "bg-gray-800/40 p-4 rounded-xl border border-gray-700/50" }, React.createElement("h2", { className: "text-xl font-bold text-gray-200 mb-2" }, "Astro Islands Integration"), React.createElement("div", { className: "astro-island border-l-4 border-amber-500 pl-4 py-1", "data-astro-cid": "island" }, React.createElement("button", { className: "bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition" }, "\n            Astro Interactive Client Button\n          "))), React.createElement("section", { className: "bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 mdx-section" }, React.createElement("h2", { className: "text-xl font-bold text-gray-200 mb-2" }, "MDX Rendering"), React.createElement(MDXContent, null), React.createElement("div", { className: "mdx-meta text-xs text-gray-500 mt-2" }, "\n          Frontmatter Title: ", frontmatter.title, " | Author: ", frontmatter.author)), React.createElement("section", { className: "bg-gray-800/40 p-4 rounded-xl border border-gray-700/50" }, React.createElement("h2", { className: "text-xl font-bold text-gray-200 mb-2" }, "CSS Modules"), React.createElement("div", { className: `${styles.card} css-module-card` }, "\n          Hashed component style loaded.\n        ")), React.createElement("section", { className: "bg-gray-800/40 p-4 rounded-xl border border-gray-700/50" }, React.createElement("h2", { className: "text-xl font-bold text-gray-200 mb-2" }, "Web Workers"), React.createElement("div", { className: "worker-result text-indigo-400 font-mono" }, "\n          Worker double(21) response: ", React.createElement("span", { id: "worker-val" }, workerResult !== null ? workerResult : 'Calculating...'))), React.createElement("section", { className: "bg-gray-800/40 p-4 rounded-xl border border-gray-700/50" }, React.createElement("h2", { className: "text-xl font-bold text-gray-200 mb-2" }, "WebAssembly (WASM)"), React.createElement("div", { className: "wasm-result text-sky-400 font-mono" }, "\n          WASM add(10, 32) response: ", React.createElement("span", { id: "wasm-val" }, wasmResult !== null ? wasmResult : 'Calculating...'))));
}