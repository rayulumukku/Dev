"use client";
import React, { useState } from 'react';
import { addTodoItem } from './actions.js';

export function App() {
  const [todos, setTodos] = useState([]);
  const [status, setStatus] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    setStatus('Submitting mutation...');
    try {
      const res = await addTodoItem(formData);
      setTodos([...todos, res.title]);
      setStatus('Mutation successful!');
    } catch (err) {
      setStatus(`Mutation error: ${err.message}`);
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
      <h1>Server Actions Demo with Ray</h1>
      <form onSubmit={handleSubmit}>
        <input name="title" placeholder="Add Todo..." required />
        <button type="submit">Submit Action</button>
      </form>
      <p>{status}</p>
      <ul>
        {todos.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
