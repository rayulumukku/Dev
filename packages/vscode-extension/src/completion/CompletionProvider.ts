import { RAY_CONFIG_SCHEMA } from '../config/schema.js';
import { ConfigOption } from '../types.js';

export function getCompletions(): ConfigOption[] {
  return RAY_CONFIG_SCHEMA;
}
