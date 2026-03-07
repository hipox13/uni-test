const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export function getApiUrl(path: string) {
  return `${baseURL}/api/v1${path}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(getApiUrl(path), { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
