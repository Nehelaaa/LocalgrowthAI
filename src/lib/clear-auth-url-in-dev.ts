/**
 * See instrumentation.ts. Imported for side effects before NextAuth reads env.
 */
if (
  process.env.NODE_ENV === "development" &&
  process.env.AUTH_KEEP_URL !== "1"
) {
  delete process.env.AUTH_URL;
  delete process.env.NEXTAUTH_URL;
}
