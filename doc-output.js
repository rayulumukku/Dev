/*@jsxRuntime automatic*/
/*@jsxImportSource react*/
function _createMdxContent(props) {
  const _components = {
    h1: "h1",
    li: "li",
    ul: "ul",
    ...props.components
  };
  return <><_components.h1>{"MDX Heading Verification"}</_components.h1>{"\n"}<_components.ul>{"\n"}<_components.li>{"MDX List Item 1"}</_components.li>{"\n"}<_components.li>{"MDX List Item 2"}</_components.li>{"\n"}</_components.ul></>;
}
export default function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? <MDXLayout {...props}><_createMdxContent {...props} /></MDXLayout> : _createMdxContent(props);
}

export const frontmatter = {
  "title": "MDX Verification",
  "author": "Ray Test Suite"
};
export const title = "MDX Verification";
export const author = "Ray Test Suite";

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      console.log('[Ray MDX HMR] MDX document updated.');
    }
  });
}
