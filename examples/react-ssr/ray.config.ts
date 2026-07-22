export default {
  ssr: {
    enabled: true,
    entry: './src/entry-server.tsx',
    clientEntry: './src/entry-client.tsx',
    streaming: true,
  },
};
