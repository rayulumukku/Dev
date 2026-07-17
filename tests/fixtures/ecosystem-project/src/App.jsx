import React, { useState, useEffect } from 'react';
import Layout from './app/layout.jsx';
import Page from './app/page.jsx';
import MDXContent, { frontmatter } from './doc.mdx';
import styles from './styles.module.css';
import loadWasm from './math.wasm';

// Simulated Remix-style loader
export async function loader() {
  return { message: "Hello from Remix Loader!" };
}

export default function App() {
  const [remixMessage, setRemixMessage] = useState('');
  const [workerResult, setWorkerResult] = useState(null);
  const [wasmResult, setWasmResult] = useState(null);

  // 1. Remix loader simulation
  useEffect(() => {
    loader().then(data => setRemixMessage(data.message));
  }, []);

  // 2. Web Worker instantiation and verification
  useEffect(() => {
    try {
      const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = (e) => {
        setWorkerResult(e.data.result);
      };
      worker.postMessage({ val: 21 }); // Should respond with 42 (21 * 2)
    } catch (err) {
      console.error('Failed to initialize Web Worker:', err);
    }
  }, []);

  // 3. WASM dynamic compilation and verification
  useEffect(() => {
    loadWasm().then(exports => {
      if (exports && typeof exports.add === 'function') {
        setWasmResult(exports.add(10, 32)); // Should equal 42
      }
    }).catch(err => {
      console.error('Failed to load WASM:', err);
    });
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-500">
        Ecosystem Verification App
      </h1>

      {/* React & Next.js check */}
      <section className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-200 mb-2">React & Next.js Routing</h2>
        <Layout>
          <Page />
        </Layout>
      </section>

      {/* Remix loader check */}
      <section className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-200 mb-2">Remix Loaders</h2>
        <div className="remix-loader-msg text-emerald-400">{remixMessage || 'Loading remix message...'}</div>
      </section>

      {/* Astro Island integration check */}
      <section className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-200 mb-2">Astro Islands Integration</h2>
        <div className="astro-island border-l-4 border-amber-500 pl-4 py-1" data-astro-cid="island">
          <button className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition">
            Astro Interactive Client Button
          </button>
        </div>
      </section>

      {/* MDX rendering check */}
      <section className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 mdx-section">
        <h2 className="text-xl font-bold text-gray-200 mb-2">MDX Rendering</h2>
        <MDXContent />
        <div className="mdx-meta text-xs text-gray-500 mt-2">
          Frontmatter Title: {frontmatter.title} | Author: {frontmatter.author}
        </div>
      </section>

      {/* CSS Modules check */}
      <section className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-200 mb-2">CSS Modules</h2>
        <div className={`${styles.card} css-module-card`}>
          Hashed component style loaded.
        </div>
      </section>

      {/* Web Workers check */}
      <section className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-200 mb-2">Web Workers</h2>
        <div className="worker-result text-indigo-400 font-mono">
          Worker double(21) response: <span id="worker-val">{workerResult !== null ? workerResult : 'Calculating...'}</span>
        </div>
      </section>

      {/* WASM check */}
      <section className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-200 mb-2">WebAssembly (WASM)</h2>
        <div className="wasm-result text-sky-400 font-mono">
          WASM add(10, 32) response: <span id="wasm-val">{wasmResult !== null ? wasmResult : 'Calculating...'}</span>
        </div>
      </section>
    </div>
  );
}
