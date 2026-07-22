export function getAuthHeaders(token?: string): Record<string, string> {
  if (!token) return {};
  return {
    Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
  };
}
