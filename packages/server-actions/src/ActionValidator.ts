export class ActionValidator {
  static validateActionExport(exportName: string, id: string): { valid: boolean; error?: string } {
    if (exportName === 'default') {
      return {
        valid: true, // Default export actions are allowed
      };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(exportName)) {
      return {
        valid: false,
        error: `[Ray Server Actions Diagnostic Error] Invalid action export name "${exportName}" in "${id}".`,
      };
    }
    return { valid: true };
  }
}
