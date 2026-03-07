const TOKEN_KEY = "unicef_donor_token";

export function getDonorToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setDonorToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearDonorToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isDonorAuthenticated(): boolean {
  return !!getDonorToken();
}
