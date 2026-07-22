import React from 'react';
import styles, { primaryButton } from './Button.module.css';

export function App() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>React with CSS Modules on Ray</h1>
      <button className={primaryButton}>Click Me</button>
    </div>
  );
}

export default App;
