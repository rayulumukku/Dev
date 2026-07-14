import React from 'react';
import { renderToString, renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App.jsx';

/**
 * Server-side render execution handler.
 * Supports standard renderToPipeableStream streaming, falling back to renderToString.
 */
export function render(url, context, options) {
  const element = React.createElement(
    StaticRouter,
    { location: url },
    React.createElement(App, null)
  );

  if (options && options.streaming) {
    return new Promise((resolve, reject) => {
      let didError = false;
      const stream = renderToPipeableStream(element, {
        onShellReady() {
          resolve({ stream, didError });
        },
        onShellError(err) {
          reject(err);
        },
        onError(err) {
          didError = true;
          console.error('[Ray SSR Stream Error]', err);
        }
      });
    });
  }

  // Fallback to renderToString
  const html = renderToString(element);
  return Promise.resolve({ html });
}
