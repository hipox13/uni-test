const baseURL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export function getApiUrl(path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseURL}/api/v1${cleanPath}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(getApiUrl(path), { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
