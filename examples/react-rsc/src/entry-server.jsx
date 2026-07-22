import React from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App.jsx';
import { FlightRenderer } from '@ray/react-server';

export async function render(props = {}) {
  const html = renderToString(<App />);
  const flightStream = await FlightRenderer.renderToFlightStream(<App />);

  return {
    html,
    flightStream,
    css: '',
  };
}
