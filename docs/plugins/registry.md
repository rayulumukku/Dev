# Ray Plugin Registry and Package Management (`@ray/plugin-registry` & `@ray/plugin-manager`)

The Ray plugin ecosystem provides a first-class package management system enabling developers to search, install, update, uninstall, inspect, doctor, and publish Ray plugins.

## Features

- **CLI Management**: Subcommands under `ray plugin` (`search`, `install`, `uninstall`, `update`, `list`, `doctor`, `publish`).
- **Plugin Manifest (`ray-plugin.json`)**: Declares plugin metadata, SDK compatibility, and extension hooks.
- **Lockfile Reproducibility (`ray-plugin.lock`)**: Stores resolved plugin versions, SHA-256 integrity checksums, and SDK versions.
- **Storage Directory (`.ray/plugins/`)**: Isolated local storage directory for installed plugins.
- **Doctor Health Diagnostics (`ray plugin doctor`)**: Verifies missing dependencies, SDK compatibility, corrupted files, and duplicate plugins.

## Plugin Manifest (`ray-plugin.json`)

```json
{
  "name": "@ray/plugin-mdx",
  "version": "1.0.0",
  "sdk": "^1.0.0",
  "description": "Official Ray MDX compilation plugin.",
  "keywords": ["mdx", "markdown", "jsx"],
  "hooks": ["transform", "handleHotUpdate"],
  "ray": {
    "minimum": "1.0.0",
    "recommended": "1.2.0"
  }
}
```

## CLI Usage

### Search Plugins

```bash
ray plugin search mdx
```

### Install Plugins

```bash
# Install from catalog or npm
ray plugin install @ray/plugin-mdx

# Install local plugin path
ray plugin install ../my-local-plugin
```

### List Installed Plugins

```bash
ray plugin list
```

### Run Health Doctor Diagnostics

```bash
ray plugin doctor
```

### Update & Uninstall

```bash
# Update lockfile resolution
ray plugin update

# Uninstall plugin
ray plugin uninstall @ray/plugin-mdx
```

### Publish Plugin

```bash
ray plugin publish
```

## Security & Reproducibility Model

1. **Integrity Hashes**: SHA-256 content hashes are calculated and stored in `ray-plugin.lock` to prevent tampering or corruption.
2. **Version Pinning**: `ray-plugin.lock` ensures identical plugin versions and resolution across CI/CD and developer environments.
3. **Deterministic Clean Fallbacks**: Corrupted plugin folders or broken checksums trigger warning diagnostics via `ray plugin doctor`.
