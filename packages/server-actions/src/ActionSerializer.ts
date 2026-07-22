export class ActionSerializer {
  static serialize(value: any): string {
    return JSON.stringify(value);
  }

  static deserialize(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  static parseFormData(formData: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(formData)) {
      result[k] = v;
    }
    return result;
  }
}
