export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const session = localStorage.getItem('auth-session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.state?.session?.token || null;
    }
  } catch {
    return null;
  }
  return null;
}
