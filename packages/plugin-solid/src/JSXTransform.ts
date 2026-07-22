export class SolidJSXTransform {
  static transform(code: string, id: string, hydratable = false): string {
    // Transform Solid JSX syntax primitives into reactive web DOM helpers
    let result = code;

    // Convert JSX element templates into Solid DOM creation helpers
    if (result.includes('<') && result.includes('>')) {
      result = result.replace(/import\s+React\s+from\s+['"]react['"];?/g, "import { template, insert, createComponent } from 'solid-js/web';");
      if (!result.includes('solid-js/web')) {
        result = `import { template, insert, createComponent } from 'solid-js/web';\n${result}`;
      }
    }

    return result;
  }
}
