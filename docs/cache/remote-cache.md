# Remote Cache Support (`@ray/remote-cache`)

The `@ray/remote-cache` package allows sharing content-addressed build artifacts across developer machines and CI pipelines.

## Configuration

Enable in `ray.config.ts`:

```typescript
export default {
  cache: {
    enabled: true,
    remote: {
      enabled: true,
      url: 'https://cache.ray-build.dev',
      token: process.env.RAY_CACHE_TOKEN,
      namespace: 'team-frontend',
    },
  },
};
```

## Protocol Endpoints

The remote cache client uses standard HTTP verbs:
- `HEAD /:namespace/:hash`: Check artifact existence
- `GET /:namespace/:hash`: Download cached artifact
- `PUT /:namespace/:hash`: Upload new compiled artifact
