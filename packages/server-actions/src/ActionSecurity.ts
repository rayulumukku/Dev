export class ActionSecurity {
  static validateCSRF(token?: string, expectedToken?: string): boolean {
    if (!expectedToken) return true;
    return Boolean(token && token === expectedToken);
  }

  static validatePayloadSize(payloadLength: number, maxPayloadSizeStr = '2mb'): boolean {
    let maxBytes = 2 * 1024 * 1024; // 2MB default
    if (maxPayloadSizeStr.toLowerCase().endsWith('mb')) {
      const mb = parseFloat(maxPayloadSizeStr);
      if (!isNaN(mb)) maxBytes = mb * 1024 * 1024;
    } else if (maxPayloadSizeStr.toLowerCase().endsWith('kb')) {
      const kb = parseFloat(maxPayloadSizeStr);
      if (!isNaN(kb)) maxBytes = kb * 1024;
    }

    return payloadLength <= maxBytes;
  }

  static validateActionId(actionId: string): boolean {
    return Boolean(actionId && typeof actionId === 'string' && actionId.length > 0 && /^[a-zA-Z0-9_\-\.\#\/]+$/.test(actionId));
  }
}
