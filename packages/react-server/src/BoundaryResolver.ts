import { ModuleBoundaryType } from './types.js';

export class BoundaryResolver {
  static resolveBoundary(code: string): ModuleBoundaryType {
    const trimmed = code.trimStart();
    if (trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'")) {
      return 'client';
    }
    if (trimmed.startsWith('"use server"') || trimmed.startsWith("'use server'")) {
      return 'server';
    }
    return 'shared';
  }

  static validateBoundaryImport(importerBoundary: ModuleBoundaryType, importedBoundary: ModuleBoundaryType, importerId: string, importedId: string): { valid: boolean; error?: string } {
    // Client components cannot export or directly import server components containing server-only logic
    if (importerBoundary === 'client' && importedBoundary === 'server') {
      return {
        valid: false,
        error: `[Ray RSC Diagnostic Error] Invalid boundary crossing: Client component "${importerId}" cannot directly import Server component "${importedId}". Convert to a child prop or pass via slots.`,
      };
    }
    return { valid: true };
  }
}
