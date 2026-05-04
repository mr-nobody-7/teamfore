import axios from "axios";

const api = axios.create({
  // Always call through Next.js rewrite so both local and production are consistent.
  baseURL: "/api",
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
