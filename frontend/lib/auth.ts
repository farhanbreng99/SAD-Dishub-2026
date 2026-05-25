import Cookies from "js-cookie";
import api from "./axios";
import type {
  ApiResponse,
  LoginFormData,
  LoginResponse,
  MeResponse,
  RegisterFormData,
  RegisterResponse,
  User,
  UserRole,
} from "@/types";

const TOKEN_KEY = "auth_token";
const ROLE_KEY = "user_role";
const USER_KEY = "auth_user";

// Cookie options: 7 days, secure in production
const cookieOptions: Cookies.CookieAttributes = {
  expires: 7,
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

// ─── Token Management ──────────────────────────────

export function saveToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, cookieOptions);
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function removeToken(): void {
  Cookies.remove(TOKEN_KEY, { path: "/" });
}

// ─── Role Management ───────────────────────────────

export function saveRole(role: UserRole): void {
  Cookies.set(ROLE_KEY, role, cookieOptions);
}

export function getRole(): UserRole | undefined {
  return Cookies.get(ROLE_KEY) as UserRole | undefined;
}

export function removeRole(): void {
  Cookies.remove(ROLE_KEY, { path: "/" });
}

// ─── User Cache (localStorage) ─────────────────────

export function saveUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(USER_KEY);
  return data ? (JSON.parse(data) as User) : null;
}

export function removeCachedUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_KEY);
  }
}

// ─── Auth API Calls ────────────────────────────────

export async function login(data: LoginFormData): Promise<LoginResponse> {
  const response = await api.post<ApiResponse<LoginResponse>>("/auth/login", data);
  const { user, token, role } = response.data.data;

  saveToken(token);
  saveRole(role);
  saveUser(user);

  return response.data.data;
}

export async function register(data: RegisterFormData): Promise<RegisterResponse> {
  const response = await api.post<ApiResponse<RegisterResponse>>("/auth/register", data);
  const { user, token } = response.data.data;

  saveToken(token);
  saveRole("applicant");
  saveUser(user);

  return response.data.data;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // Proceed with local cleanup even if API call fails
  }
  removeToken();
  removeRole();
  removeCachedUser();
}

export async function getUser(): Promise<MeResponse | null> {
  try {
    const response = await api.get<ApiResponse<MeResponse>>("/auth/me");
    const meData = response.data.data;
    saveUser(meData.user);
    saveRole(meData.user.role);
    return meData;
  } catch {
    return null;
  }
}

// ─── Auth State Checks ─────────────────────────────

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function hasRole(role: UserRole): boolean {
  return getRole() === role;
}

export function getRoleDashboardPath(role?: UserRole): string {
  const r = role || getRole();
  switch (r) {
    case "applicant":
      return "/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "head":
      return "/head/dashboard";
    default:
      return "/login";
  }
}
