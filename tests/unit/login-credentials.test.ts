import { beforeEach, describe, expect, it, vi } from "vitest";
import { INVALID_CREDENTIALS, SIGN_IN_FAILED } from "@/lib/auth-messages";

/**
 * `next-auth` pulls in `next/server`, which the unit-test runtime can't resolve,
 * so stand in a minimal AuthError. The action's `instanceof` check resolves to
 * this same class, which is exactly the branch under test.
 */
class MockAuthError extends Error {
  type = "AuthError";
}
vi.mock("next-auth", () => ({ AuthError: MockAuthError }));

const signIn = vi.fn();
const redirect = vi.fn((path: string) => {
  // Next's redirect() signals by throwing; mimic that so we can assert on it.
  const err = new Error(`NEXT_REDIRECT:${path}`);
  throw err;
});

vi.mock("@/lib/auth", () => ({ signIn: (...a: unknown[]) => signIn(...a) }));
vi.mock("next/navigation", () => ({ redirect: (p: string) => redirect(p) }));
vi.mock("next/headers", () => ({
  headers: async () => new Map([["host", "localleadster.com"]]) as never,
}));

const { loginWithCredentials } = await import("@/actions/login-credentials");

function form(email: string, password: string): FormData {
  const fd = new FormData();
  fd.set("email", email);
  fd.set("password", password);
  return fd;
}

/** Auth.js throws this subclass when `authorize` returns null. */
class CredentialsSignin extends MockAuthError {
  type = "CredentialsSignin";
}

describe("loginWithCredentials", () => {
  beforeEach(() => {
    signIn.mockReset();
    redirect.mockClear();
  });

  it("returns a form error instead of throwing when credentials are rejected", async () => {
    // Regression: this threw out of the Server Action and rendered a 500 page,
    // so a wrong password looked like the whole site had crashed.
    signIn.mockRejectedValue(new CredentialsSignin());

    const state = await loginWithCredentials({}, form("a@b.com", "wrong"));

    expect(state.error).toBe(INVALID_CREDENTIALS);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("echoes the email back so a failed attempt doesn't force a retype", async () => {
    signIn.mockRejectedValue(new CredentialsSignin());
    const state = await loginWithCredentials({}, form("  Founder@Example.COM ", "wrong"));
    expect(state.email).toBe("founder@example.com");
  });

  it("never echoes the password back to the client", async () => {
    signIn.mockRejectedValue(new CredentialsSignin());
    const state = await loginWithCredentials({}, form("a@b.com", "hunter2"));
    expect(JSON.stringify(state)).not.toContain("hunter2");
  });

  it("uses one message for a bad password and an unknown email", async () => {
    signIn.mockRejectedValue(new CredentialsSignin());
    const unknown = await loginWithCredentials({}, form("nobody@nowhere.test", "x"));
    const badPass = await loginWithCredentials({}, form("a@b.com", "wrong"));
    // Differing copy would let an attacker enumerate registered accounts.
    expect(unknown.error).toBe(badPass.error);
  });

  it("reports a generic failure for non-credentials auth errors", async () => {
    class ConfigError extends MockAuthError {
      type = "Configuration";
    }
    signIn.mockRejectedValue(new ConfigError());
    const state = await loginWithCredentials({}, form("a@b.com", "x"));
    expect(state.error).toBe(SIGN_IN_FAILED);
  });

  it("rethrows anything that is not an AuthError", async () => {
    signIn.mockRejectedValue(new TypeError("database is down"));
    await expect(loginWithCredentials({}, form("a@b.com", "x"))).rejects.toThrow(
      "database is down"
    );
  });

  it("redirects to the returned path on success", async () => {
    signIn.mockResolvedValue("https://localleadster.com/dashboard?x=1");
    await expect(loginWithCredentials({}, form("a@b.com", "right"))).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard?x=1"
    );
  });

  it("refuses a redirect target on another origin", async () => {
    signIn.mockResolvedValue("https://evil.example.com/dashboard");
    const state = await loginWithCredentials({}, form("a@b.com", "right"));
    expect(state.error).toBe(SIGN_IN_FAILED);
    expect(redirect).not.toHaveBeenCalled();
  });
});
