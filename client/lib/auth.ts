export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setRole(role: string) {
  localStorage.setItem("role", role);
}

export function getRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}