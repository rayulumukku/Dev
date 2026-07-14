import React, { useState } from 'react';

/**
 * Main Application Component for the Ray Dev Server Demo.
 * Uses standard React hooks and inline styling to display a polished interactive UI.
 */
export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={styles.card}>
      <h1 style={styles.title}>Ray Dev Server</h1>
      <p style={styles.subtitle}>
        JSX files are transformed dynamically on request into native ES Modules.
        No bundle step, running directly in your browser.
      </p>

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
        <span style={styles.badge}>Milestone 1 Active</span>
        <span style={styles.badge}>Dynamic Compiler</span>
        <span style={styles.badge}>Conditional HTTP Cache</span>
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
    fontSize: '2.8rem',
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
    marginBottom: '2.5rem',
    lineHeight: '1.6',
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
    marginTop: '2.5rem',
    flexWrap: 'wrap',
  },
  badge: {
    background: 'rgba(99, 102, 241, 0.12)',
    color: '#c7d2fe',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    padding: '0.4rem 0.9rem',
    borderRadius: '9999px',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
};
