import { describe, it, expect, vi } from 'vitest';
import {
  PluginContainer,
  PluginContext,
  RayPlugin,
  runResolveId,
  runLoad,
  runTransform
} from '../../packages/core/src/plugins/index.js';
import { transformFile, transformJsx } from '../../packages/transform/src/index.js';
import { Resolver } from '../../packages/core/src/resolver/index.js';

describe("Ray Native Plugin System (PR-05)", () => {
  it("should validate plugin names on registration", () => {
    const container = new PluginContainer();
    expect(() => container.register({} as any)).toThrowError(/valid name/);
    expect(() => container.register({ name: "" } as any)).toThrowError(/valid name/);
    expect(() => container.register({ name: "   " } as any)).toThrowError(/valid name/);
  });

  it("should enforce plugin ordering (pre -> normal -> post)", () => {
    const log: string[] = [];

    const normalPlugin: RayPlugin = {
      name: "normal-plugin",
      transform() {
        log.push("normal");
        return null;
      }
    };

    const postPlugin: RayPlugin = {
      name: "post-plugin",
      enforce: "post",
      transform() {
        log.push("post");
        return null;
      }
    };

    const prePlugin: RayPlugin = {
      name: "pre-plugin",
      enforce: "pre",
      transform() {
        log.push("pre");
        return null;
      }
    };

    // Registered in arbitrary order: normal, post, pre
    const container = new PluginContainer([normalPlugin, postPlugin, prePlugin]);
    const plugins = container.getPlugins();

    expect(plugins.map(p => p.name)).toEqual(["pre-plugin", "normal-plugin", "post-plugin"]);
  });

  it("should maintain deterministic execution order within enforce groups", () => {
    const pre1: RayPlugin = { name: "pre-1", enforce: "pre" };
    const pre2: RayPlugin = { name: "pre-2", enforce: "pre" };
    const norm1: RayPlugin = { name: "norm-1" };
    const norm2: RayPlugin = { name: "norm-2" };
    const post1: RayPlugin = { name: "post-1", enforce: "post" };
    const post2: RayPlugin = { name: "post-2", enforce: "post" };

    const container = new PluginContainer([norm1, post1, pre1, norm2, pre2, post2]);
    expect(container.getPlugins().map(p => p.name)).toEqual([
      "pre-1",
      "pre-2",
      "norm-1",
      "norm-2",
      "post-1",
      "post-2"
    ]);
  });

  it("should support async plugin hooks", async () => {
    const asyncPlugin: RayPlugin = {
      name: "async-plugin",
      async resolveId(id) {
        return new Promise(resolve => setTimeout(() => resolve(`async:${id}`), 10));
      },
      async load(id) {
        return new Promise(resolve => setTimeout(() => resolve(`// async loaded: ${id}`), 10));
      },
      async transform(code) {
        return new Promise(resolve => setTimeout(() => resolve({ code: `${code}\n// async transformed` }), 10));
      }
    };

    const container = new PluginContainer([asyncPlugin]);

    const resolved = await container.resolveId("foo");
    expect(resolved).toBe("async:foo");

    const loaded = await container.load("foo");
    expect(loaded).toBe("// async loaded: foo");

    const transformed = await container.transform("const a = 1;", "file.js");
    expect(transformed.code).toContain("// async transformed");
  });

  it("should allow resolve override in plugin resolveId", async () => {
    const overridePlugin: RayPlugin = {
      name: "virtual-resolver",
      resolveId(id) {
        if (id === "virtual:my-module") {
          return "/abs/path/virtual-my-module.js";
        }
        return null;
      }
    };

    const container = new PluginContainer([overridePlugin]);
    const resolver = new Resolver("/project-root", { pluginContainer: container });

    const resolved = await resolver.resolveId("virtual:my-module");
    expect(resolved).toBe("/abs/path/virtual-my-module.js");
  });

  it("should allow load override in plugin load", async () => {
    const mockLoader: RayPlugin = {
      name: "mock-loader",
      load(id) {
        if (id === "/abs/virtual.js") {
          return "export const virtual = true;";
        }
        return null;
      }
    };

    const container = new PluginContainer([mockLoader]);
    const loaded = await container.load("/abs/virtual.js");
    expect(loaded).toBe("export const virtual = true;");

    const missing = await container.load("/abs/regular.js");
    expect(missing).toBeNull();
  });

  it("should support chained transforms", async () => {
    const pluginA: RayPlugin = {
      name: "transform-a",
      transform(code) {
        return code + "\n// Step 1";
      }
    };

    const pluginB: RayPlugin = {
      name: "transform-b",
      transform(code) {
        return code + "\n// Step 2";
      }
    };

    const container = new PluginContainer([pluginA, pluginB]);
    const result = await container.transform("console.log('init');", "main.js");
    expect(result.code).toBe("console.log('init');\n// Step 1\n// Step 2");
  });

  it("should integrate plugin transform hooks into packages/transform", async () => {
    const valuePlugin: RayPlugin = {
      name: "value-plugin",
      transform(code) {
        return code.replace("1", "42");
      }
    };

    const container = new PluginContainer([valuePlugin]);
    const output = await transformJsx("export const x = 1;", "app.js", { pluginContainer: container });

    expect(output).toContain("42");
  });


  it("should bubble plugin errors with plugin name included", async () => {
    const buggyPlugin: RayPlugin = {
      name: "buggy-plugin",
      transform() {
        throw new Error("Syntax transform error");
      }
    };

    const container = new PluginContainer([buggyPlugin]);
    await expect(container.transform("code", "file.js")).rejects.toThrowError(
      /\[Plugin: buggy-plugin\] transform error: Syntax transform error/
    );
  });

  it("should provide minimal, safe PluginContext to hooks", async () => {
    let capturedContext: PluginContext | null = null;

    const ctxPlugin: RayPlugin = {
      name: "ctx-checker",
      transform(this: PluginContext, code) {
        capturedContext = this;
        return code;
      }
    };

    const container = new PluginContainer([ctxPlugin], {
      root: "/custom-root",
      command: "build",
      mode: "production"
    });

    await container.transform("let x = 1;", "file.js");

    expect(capturedContext).not.toBeNull();
    expect(capturedContext!.root).toBe("/custom-root");
    expect(capturedContext!.command).toBe("build");
    expect(capturedContext!.mode).toBe("production");
    expect(typeof capturedContext!.resolve).toBe("function");
    expect(typeof capturedContext!.warn).toBe("function");
    expect(typeof capturedContext!.error).toBe("function");
  });

  it("should retain unchanged behavior when zero plugins are registered", async () => {
    const container = new PluginContainer([]);
    expect(container.getPlugins()).toHaveLength(0);

    const resolveRes = await container.resolveId("foo");
    expect(resolveRes).toBeNull();

    const loadRes = await container.load("foo");
    expect(loadRes).toBeNull();

    const transformRes = await container.transform("const a = 1;", "file.js");
    expect(transformRes.code).toBe("const a = 1;");
  });
});
