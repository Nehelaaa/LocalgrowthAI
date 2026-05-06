/** Defaults for sensitive HttpOnly cookies (secure over HTTPS in production only). */
export function secureHttpOnlyDefaults() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  };
}
