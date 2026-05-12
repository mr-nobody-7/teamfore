import api from "@/lib/axios";
import type {
  ApiResponse,
  LoginPayload,
  RegisterPayload,
  RegisterWorkspacePayload,
  SafeUser,
} from "@/types/api";

export interface MeData {
  user: SafeUser & {
    workspace: {
      id: string;
      name: string;
      country: string | null;
      timezone: string;
      createdAt: string;
    };
  };
}

export async function getMe(): Promise<MeData["user"]> {
  const { data } = await api.get<ApiResponse<MeData>>("/auth/me");
  return data.data.user;
}

export async function login(payload: LoginPayload): Promise<SafeUser> {
  const { data } = await api.post<ApiResponse<{ user: SafeUser }>>(
    "/auth/login",
    payload,
  );
  return data.data.user;
}

export async function register(payload: RegisterPayload): Promise<SafeUser> {
  const { data } = await api.post<ApiResponse<{ user: SafeUser }>>(
    "/auth/register",
    payload,
  );
  return data.data.user;
}

export async function registerWorkspace(
  payload: RegisterWorkspacePayload,
): Promise<SafeUser> {
  const { data } = await api.post<ApiResponse<{ user: SafeUser }>>(
    "/auth/register-workspace",
    payload,
  );
  return data.data.user;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
