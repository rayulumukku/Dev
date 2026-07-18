# Library Mode

Ray supports packaging codebases as reusable libraries.

Enable library mode with the `--lib` flag:

```bash
ray build --lib --entry src/index.ts --name MyLibrary --formats esm,cjs,umd
```
