import React, { Suspense, lazy, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { message } from 'virtual:foo';

// Lazy loaded page for routes splitting demonstration
const LazyAbout = lazy(() => import('./About.jsx'));

export default function App() {
  const [count, setCount] = useState(() => {
    // Rehydrate the initial count from serialized data if present in window scope
    if (typeof window !== 'undefined' && window.__RAY_DATA__) {
      return window.__RAY_DATA__.initialCount || 0;
    }
    return 0;
  });

  return (
    <div style={styles.card} className="card-dynamic">
      <h1 style={styles.title}>Ray Dev Server (SSR Mode)</h1>
      <p style={styles.subtitle}>
        Pre-rendered on the server, hydrated dynamically in the browser.
      </p>

      {/* Navigation routes links */}
      <nav style={styles.nav}>
        <Link to="/" style={styles.navLink}>Home</Link>
        <Link to="/about" style={styles.navLink}>About</Link>
      </nav>

      <Routes>
        <Route path="/" element={
          <div>
            <div style={styles.counterSection}>
              <button
                style={styles.button}
                onClick={() => setCount((prev) => prev + 1)}
                id="counter-btn"
              >
                Count: {count}
              </button>
            </div>
            <div style={styles.badgeContainer}>
              <span style={styles.badge}>SSR Pre-rendered</span>
              <span style={styles.badge}>Browser Hydration</span>
              <span style={styles.badge}>Client State Kept</span>
            </div>
          </div>
        } />
        <Route path="/about" element={
          <Suspense fallback={<div style={{ color: '#9ca3af', margin: '2rem' }}>Loading lazy routes...</div>}>
            <LazyAbout />
          </Suspense>
        } />
      </Routes>

      <div style={{ marginTop: '1.5rem', color: '#94a3b8', fontSize: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
        <div>Virtual Module: <span style={{ color: '#38bdf8' }}>{message}</span></div>
        <div style={{ marginTop: '0.5rem' }}>Build Time: <span style={{ color: '#34d399' }}>__BUILD_TIME__</span></div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '2.5rem',
    boxShadow: '0 20px 40px 0 rgba(0, 0, 0, 0.5)',
  },
  title: {
    fontSize: '2.4rem',
    margin: '0 0 1rem 0',
    background: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: '800',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '1.05rem',
    color: '#9ca3af',
    marginBottom: '1.5rem',
    lineHeight: '1.6',
  },
  nav: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  navLink: {
    color: '#a5b4fc',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '1.1rem',
  },
  counterSection: {
    margin: '2rem 0',
  },
  button: {
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '0.85rem 2.2rem',
    fontSize: '1.1rem',
    fontWeight: '600',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
    outline: 'none',
  },
  badgeContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.75rem',
    marginTop: '2rem',
    flexWrap: 'wrap',
  },
  badge: {
    background: 'rgba(99, 102, 241, 0.12)',
    color: '#c7d2fe',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    padding: '0.4rem 0.9rem',
    fontSize: '0.8rem',
    borderRadius: '20px',
    fontWeight: '500',
  },
};
