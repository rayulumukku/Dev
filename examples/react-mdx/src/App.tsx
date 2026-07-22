import React from 'react';
import Content, { frontmatter, title, author, tags } from './content.mdx';

export function App() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
        <h2>{frontmatter.title || title}</h2>
        <p>By {frontmatter.author || author}</p>
        <div>
          {tags && tags.map((t: string) => (
            <span key={t} style={{ marginRight: '0.5rem', background: '#eee', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              #{t}
            </span>
          ))}
        </div>
      </header>

      <main style={{ marginTop: '1.5rem' }}>
        <Content />
      </main>
    </div>
  );
}

export default App;
