"use server";

/**
 * Sign In Server Action
 *
 * Validates user credentials through Auth.js CredentialsProvider.
 */

import { AuthError } from "next-auth";

import { signIn } from "./config";

interface SignInInput {
  email: string;
  password: string;
}

interface SignInResult {
  success: boolean;
  error?: string;
}

export async function signInAction(input: SignInInput): Promise<SignInResult> {
  const email = input.email.trim();
  const password = input.password;

  if (!email || !password) {
    return { success: false, error: "Email y contraseña son obligatorios" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") {
        return { success: false, error: "Credenciales inválidas" };
      }
      return { success: false, error: "No se pudo iniciar sesión" };
    }

    return { success: false, error: "Error al autenticar" };
  }
}
