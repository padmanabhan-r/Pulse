"use client";

import { auth } from "./firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const user = auth().currentUser;
  if (!user) throw new ApiError(401, "not_signed_in");
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const resp = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!resp.ok) {
    let detail = "request_failed";
    try {
      const j = (await resp.json()) as { detail?: string };
      detail = j.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(resp.status, detail);
  }
  return resp;
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const r = await authedFetch(path);
    return (await r.json()) as T;
  },
  async post<T>(path: string, body: unknown): Promise<T> {
    const r = await authedFetch(path, { method: "POST", body: JSON.stringify(body) });
    return (await r.json()) as T;
  },
  async patch<T>(path: string, body: unknown): Promise<T> {
    const r = await authedFetch(path, { method: "PATCH", body: JSON.stringify(body) });
    return (await r.json()) as T;
  },
};
