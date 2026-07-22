import { mdx } from '@ray/plugin-mdx';

export default {
  plugins: [
    mdx({
      remarkPlugins: [],
      rehypePlugins: [],
    }),
  ],
};
