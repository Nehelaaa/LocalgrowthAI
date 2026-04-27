/**
 * Shown when Google OAuth env vars are missing (common on local dev).
 * Explains how to get the "Continue with Google" button to appear.
 */
export function GoogleSetupHint() {
  return (
    <div
      className="rounded-xl border border-amber-200/80 bg-amber-50/90 p-3 text-left text-sm text-amber-950 dark:border-amber-700/40 dark:bg-amber-950/25 dark:text-amber-100"
      role="status"
    >
      <p className="font-semibold">Enable Google sign-in (recommended)</p>
      <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
        Add an OAuth 2.0 <strong>Web client</strong> in Google Cloud, then set in{" "}
        <code className="rounded bg-amber-100/80 px-1 font-mono text-xs dark:bg-amber-900/50">
          localgrowth-app/.env
        </code>
        :{" "}
        <code className="block mt-1 font-mono text-xs">
          GOOGLE_CLIENT_ID=…<br />
          GOOGLE_CLIENT_SECRET=…
        </code>
      </p>
      <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-300/80">
        Authorized <strong>redirect</strong> URIs (add your port + both hosts if needed):
      </p>
      <code className="mt-1 block whitespace-pre-wrap font-mono text-[11px]">
        http://localhost:3000/api/auth/callback/google{"\n"}
        http://127.0.0.1:3000/api/auth/callback/google
      </code>
      <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-300/80">
        Authorized <strong>JavaScript origins</strong> (no path):{" "}
        <code className="font-mono">http://localhost:3000</code>,{" "}
        <code className="font-mono">http://127.0.0.1:3000</code>
        {" — plus production when you deploy."}
      </p>
      <a
        className="mt-2 inline-block text-sm font-medium text-indigo-700 underline hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-200"
        href="https://console.cloud.google.com/apis/credentials"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open Google Cloud credentials
      </a>
    </div>
  );
}
