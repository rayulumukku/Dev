import React from 'react';

export default function About() {
  return (
    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', marginTop: '1rem' }}>
      <h3 style={{ color: '#818cf8', margin: '0 0 0.5rem 0' }}>About Ray SSR</h3>
      <p style={{ color: '#9ca3af', fontSize: '0.95rem', margin: 0, lineHeight: '1.5' }}>
        This page was resolved dynamically via code-splitting chunks and loaded asynchronously in the browser with full state preservation!
      </p>
    </div>
  );
}
