import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const COOKIE_NAME = "beta_testing_session";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
}

export function getAuthUrl(
  state?: string,
  isConsumerGroup: boolean = false
): string {
  // Use minimal scopes for consumer groups, full scopes for workspace groups
  const scopes = isConsumerGroup
    ? [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ]
    : [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/admin.directory.group",
        "https://www.googleapis.com/auth/groups",
        "https://www.googleapis.com/auth/apps.groups.settings",
      ];

  return client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state,
    prompt: "consent",
  });
}

export async function exchangeCodeForTokens(code: string) {
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function getUserInfo(accessToken: string) {
  client.setCredentials({ access_token: accessToken });

  const response = await fetch(
    `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }

  return response.json();
}

export function createSessionToken(session: UserSession): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: "30d" });
}

export function verifySessionToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export async function setSessionCookie(session: UserSession) {
  const token = createSessionToken(session);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function getSessionFromCookie(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getSessionFromCookie();
  if (!session) {
    throw new Error("Authentication required");
  }
  return session;
}

export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await client.refreshAccessToken();
    return credentials.access_token || null;
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    return null;
  }
}
