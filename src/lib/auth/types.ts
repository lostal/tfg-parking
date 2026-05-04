/**
 * Auth.js Type Augmentations
 *
 * Extends the default NextAuth types to include custom fields
 * embedded in the JWT token (role, entityId, fullName, Microsoft tokens).
 */

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      entityId: string | null;
      fullName: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    entityId?: string | null;
    fullName?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    scope?: string;
  }
}
