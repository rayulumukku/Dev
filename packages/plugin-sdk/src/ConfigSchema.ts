export interface ConfigFieldSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'function';
  required?: boolean;
  default?: any;
  description?: string;
}

export interface ConfigSchema {
  fields: Record<string, ConfigFieldSchema>;
}

export function validateConfig(config: any, schema: ConfigSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const cfg = config || {};

  for (const [key, field] of Object.entries(schema.fields)) {
    const val = cfg[key];

    if (val === undefined || val === null) {
      if (field.required) {
        errors.push(`Missing required configuration option "${key}"`);
      }
      continue;
    }

    if (field.type === 'array' && !Array.isArray(val)) {
      errors.push(`Option "${key}" expected array, received ${typeof val}`);
    } else if (field.type !== 'array' && typeof val !== field.type) {
      errors.push(`Option "${key}" expected ${field.type}, received ${typeof val}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
