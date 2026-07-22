import Content, { frontmatter } from './content.mdx';

export function App() {
  return (
    <div>
      <h2>{frontmatter.title}</h2>
      <p>Author: {frontmatter.author}</p>
      <Content />
    </div>
  );
}
