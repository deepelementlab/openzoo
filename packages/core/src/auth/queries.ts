import { getApiClient } from "../api/connect-client";
import type { User } from "../types";

export async function sendVerificationCode(email: string): Promise<boolean> {
  try {
    await getApiClient().call("/rpc/auth/send-code", { email });
    return true;
  } catch {
    return false;
  }
}

export async function verifyCode(email: string, code: string): Promise<{ token: string; user: User }> {
  return getApiClient().call<{ token: string; user: User }>("/rpc/auth/verify-code", { email, code });
}

export async function getCurrentUser(): Promise<User> {
  return getApiClient().call<User>("/rpc/auth/me");
}

export async function updateCurrentUser(data: { name?: string; avatar_url?: string }): Promise<User> {
  return getApiClient().call<User>("/rpc/auth/update-me", data);
}
