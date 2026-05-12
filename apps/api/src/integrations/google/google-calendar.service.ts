import { google } from "googleapis";
import { prisma } from "../../lib/db.js";
import { decrypt, encrypt } from "../../utils/encryption.js";

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

type GoogleTokenPayload = {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope: string;
};

function isInvalidGrantError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (error instanceof Error && error.message.includes("invalid_grant")) {
    return true;
  }

  if (typeof error === "object") {
    const maybeError = error as {
      response?: { data?: { error?: string } };
      error?: string;
    };

    if (maybeError.response?.data?.error === "invalid_grant") {
      return true;
    }

    if (maybeError.error === "invalid_grant") {
      return true;
    }
  }

  return false;
}

export async function saveGoogleTokens(
  userId: string,
  tokens: GoogleTokenPayload,
) {
  try {
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = encrypt(tokens.refresh_token);

    const savedRecord = await prisma.userGoogleToken.upsert({
      where: { userId },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: new Date(tokens.expiry_date),
        scope: tokens.scope,
      },
      create: {
        userId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: new Date(tokens.expiry_date),
        scope: tokens.scope,
      },
    });

    return savedRecord;
  } catch (error) {
    console.error("[saveGoogleTokens] Failed to save Google tokens", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getGoogleClient(
  userId: string,
): Promise<OAuth2Client | null> {
  try {
    const tokenRecord = await prisma.userGoogleToken.findUnique({
      where: { userId },
    });

    if (!tokenRecord) {
      return null;
    }

    const accessToken = decrypt(tokenRecord.accessToken);
    const refreshToken = decrypt(tokenRecord.refreshToken);

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: tokenRecord.expiresAt.getTime(),
    });

    client.on("tokens", async (refreshedTokens) => {
      try {
        const nextData: {
          accessToken?: string;
          refreshToken?: string;
          expiresAt?: Date;
        } = {};

        if (refreshedTokens.access_token) {
          nextData.accessToken = encrypt(refreshedTokens.access_token);
        }

        if (refreshedTokens.refresh_token) {
          nextData.refreshToken = encrypt(refreshedTokens.refresh_token);
        }

        if (refreshedTokens.expiry_date) {
          nextData.expiresAt = new Date(refreshedTokens.expiry_date);
        }

        if (Object.keys(nextData).length === 0) {
          return;
        }

        await prisma.userGoogleToken.update({
          where: { userId },
          data: nextData,
        });
      } catch (error) {
        console.error("[getGoogleClient] Failed to persist refreshed tokens", {
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await client.getAccessToken();

    return client;
  } catch (error) {
    if (isInvalidGrantError(error)) {
      await prisma.userGoogleToken.deleteMany({ where: { userId } });
      return null;
    }

    console.error("[getGoogleClient] Failed to create Google OAuth client", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function revokeGoogleAccess(userId: string): Promise<void> {
  try {
    const client = await getGoogleClient(userId);

    if (client) {
      await client.revokeCredentials();
    }

    await prisma.userGoogleToken.deleteMany({ where: { userId } });
  } catch (error) {
    console.error("[revokeGoogleAccess] Failed to revoke Google access", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function hasCalendarAccess(userId: string): Promise<boolean> {
  try {
    const tokenRecord = await prisma.userGoogleToken.findUnique({
      where: { userId },
      select: { id: true },
    });

    return Boolean(tokenRecord);
  } catch (error) {
    console.error("[hasCalendarAccess] Failed to check Calendar access", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
