export class Session {
  private static sessionId = `session_${Math.random().toString(36).substring(2, 9)}`;

  static getSessionId(): string {
    return this.sessionId;
  }

  static newSession(): string {
    this.sessionId = `session_${Math.random().toString(36).substring(2, 9)}`;
    return this.sessionId;
  }
}
