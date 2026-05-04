import axios from "axios";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. Define it in apps/web/.env.local for development and in your deployment environment for production.",
  );
}

const resolvedBaseUrl =
  process.env.NODE_ENV === "production" ? `${apiBaseUrl}/api` : apiBaseUrl;

const api = axios.create({
  baseURL: resolvedBaseUrl,
  // Send the httpOnly cookie on every request
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function isPublicRoute(pathname: string): boolean {
  const exactPublicRoutes = new Set(["/", "/login", "/register", "/changelog"]);
  return exactPublicRoutes.has(pathname);
}

// On 401 (expired / invalid session) redirect to login (client-side only)
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !isPublicRoute(window.location.pathname)
    ) {
      window.location.replace("/login");
    }
    return Promise.reject(error);
  },
);

export default api;
