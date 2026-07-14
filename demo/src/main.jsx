import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './style.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(App, null));
}
