"use server";

/**
 * Sign Up Server Action
 *
 * Creates a new user with hashed password, profile, and default preferences.
 */

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles, userPreferences, users } from "@/lib/db/schema";

interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  entityId?: string;
  hasFixedParking?: boolean;
  hasFixedOffice?: boolean;
}

interface SignUpResult {
  success: boolean;
  error?: string;
}

export async function signUpAction(input: SignUpInput): Promise<SignUpResult> {
  const { email, password, fullName, phone, entityId } = input;

  // Check if user already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { success: false, error: "Ya existe una cuenta con ese email" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const [user] = await db
    .insert(users)
    .values({
      email,
      password: hashedPassword,
      name: fullName,
    })
    .returning({ id: users.id });

  if (!user) {
    return { success: false, error: "Error al crear la cuenta" };
  }

  // Create profile
  await db
    .insert(profiles)
    .values({
      id: user.id,
      email,
      fullName,
      phone: phone || null,
      entityId: entityId || null,
      role: "employee",
    })
    .onConflictDoNothing();

  // Create default preferences
  await db
    .insert(userPreferences)
    .values({ userId: user.id })
    .onConflictDoNothing();

  return { success: true };
}
