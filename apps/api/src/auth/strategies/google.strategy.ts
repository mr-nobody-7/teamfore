import bcrypt from "bcrypt";
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  type Profile,
  type VerifyCallback,
} from "passport-google-oauth20";
import { prisma } from "../../lib/db.js";

export interface GoogleAuthUser {
  userId: string;
  email: string;
  name: string;
  workspaceId: string;
  role: "USER" | "MANAGER" | "ADMIN";
  teamId: string | null;
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL?.trim() || "/auth/google/callback";

const OAUTH_ONBOARDING_WORKSPACE_NAME = "OAuth Onboarding";

function ensureGoogleOauthEnv() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    );
  }
}

function profileDisplayName(profile: Profile, fallbackEmail: string): string {
  const trimmed = profile.displayName?.trim();
  if (trimmed) return trimmed;

  const given = profile.name?.givenName?.trim() ?? "";
  const family = profile.name?.familyName?.trim() ?? "";
  const combined = `${given} ${family}`.trim();
  if (combined) return combined;

  return fallbackEmail.split("@")[0] ?? "Google User";
}

async function getOrCreateOnboardingWorkspaceId(): Promise<string> {
  const existing = await prisma.workspace.findFirst({
    where: { name: OAUTH_ONBOARDING_WORKSPACE_NAME },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.workspace.create({
    data: { name: OAUTH_ONBOARDING_WORKSPACE_NAME },
    select: { id: true },
  });
  return created.id;
}

async function findOrCreateGoogleUser(
  profile: Profile,
): Promise<GoogleAuthUser> {
  const email = profile.emails?.[0]?.value?.trim().toLowerCase();
  if (!email) {
    throw new Error("Google account email is required");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      workspaceId: true,
      role: true,
      teamId: true,
      isActive: true,
    },
  });

  if (existingUser) {
    if (!existingUser.isActive) {
      throw new Error("Account is inactive");
    }

    return {
      userId: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      workspaceId: existingUser.workspaceId,
      role: existingUser.role,
      teamId: existingUser.teamId,
    };
  }

  const workspaceId = await getOrCreateOnboardingWorkspaceId();
  const name = profileDisplayName(profile, email);
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "USER",
      workspaceId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      workspaceId: true,
      role: true,
      teamId: true,
    },
  });

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    workspaceId: user.workspaceId,
    role: user.role,
    teamId: user.teamId,
  };
}

export function configureGoogleStrategy(): void {
  ensureGoogleOauthEnv();

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID!,
        clientSecret: GOOGLE_CLIENT_SECRET!,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
      ) => {
        try {
          const user = await findOrCreateGoogleUser(profile);
          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      },
    ),
  );
}
