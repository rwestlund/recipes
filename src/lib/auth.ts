import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "recipes_edit";
const TTL_SECONDS = 60 * 60 * 24 * 30;

// Local runs have no household secret. This value is not used when EDIT_PASSWORD
// is set, when NODE_ENV is production, or when DATABASE_URL is set.
const LOCAL_DEV_PASSWORD = "dev";

export function editPassword(): string | null {
  const fromEnv = process.env.EDIT_PASSWORD?.trim() ?? "";
  if (fromEnv !== "") return fromEnv;
  if (process.env.NODE_ENV === "production") return null;
  if ((process.env.DATABASE_URL?.trim() ?? "") !== "") return null;
  return LOCAL_DEV_PASSWORD;
}

export function editingConfigured(): boolean {
  return editPassword() !== null;
}

export function safeNext(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return "/";
  }
  return value;
}

function sign(exp: number, password: string): string {
  return createHmac("sha256", password).update(`v1.${exp}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function setEditorCookie(): Promise<void> {
  const password = editPassword();
  if (!password) return;
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const jar = await cookies();
  jar.set(COOKIE, `${exp}.${sign(exp, password)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function clearEditorCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function isEditor(): Promise<boolean> {
  const password = editPassword();
  if (!password) return false;
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value ?? "";
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = Number(token.slice(0, dot));
  const sig = token.slice(dot + 1);
  if (!Number.isFinite(exp) || exp < Date.now() / 1000 || sig === "") return false;
  return safeEqual(sig, sign(exp, password));
}

export function passwordMatches(input: string): boolean {
  const expected = editPassword();
  if (!expected) return false;
  return safeEqual(input, expected);
}
