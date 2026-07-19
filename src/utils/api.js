export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY_WEB = import.meta.env.VITE_API_KEY_WEB;

/**
 * Wrapper untuk fetch API yang otomatis memasukkan header X-API-Key dan Authorization (JWT)
 */
export async function fetchApi(endpoint, options = {}) {
  if (API_BASE_URL === undefined) {
    throw new Error("VITE_API_BASE_URL is not defined");
  }

  // Ambil token JWT dari localStorage
  let token = null;
  try {
    const rawToken = localStorage.getItem("jwt_token");
    if (rawToken) {
      token = JSON.parse(rawToken);
    }
  } catch (e) {
    token = localStorage.getItem("jwt_token");
  }
  
  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY_WEB,
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Tangani error secara global
    let errorDetail = `API Request Failed: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorDetail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch (e) {}
    throw new Error(errorDetail);
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}
