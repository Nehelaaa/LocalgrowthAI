/**
 * Shared sign-in copy. Kept out of the `"use server"` action module, which may
 * only export async functions.
 */

/** Single wording for a bad email *or* password — never reveal which one was wrong. */
export const INVALID_CREDENTIALS = "Invalid email or password.";

/** Anything else that stopped sign-in, with no internal detail leaked to the form. */
export const SIGN_IN_FAILED = "Sign-in failed. Please try again.";
