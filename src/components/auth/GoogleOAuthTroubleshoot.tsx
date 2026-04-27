/**
 * Shown under "Continue with Google" when sign-in is configured but users get stuck on Google’s UI.
 */
export function GoogleOAuthTroubleshoot() {
  return (
    <details className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3 text-left text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
      <summary className="cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
        Stuck on Google’s sign-in page?
      </summary>
      <ul className="mt-2 list-disc space-y-1.5 pl-4">
        <li>
          Open the app in <strong>Chrome</strong> or <strong>Edge</strong>, not an embedded IDE browser — OAuth
          often hangs there.
        </li>
        <li>
          In Google Cloud → <strong>APIs &amp; Services</strong> → <strong>OAuth consent screen</strong>: if
          Publishing status is <strong>Testing</strong>, add your Gmail under <strong>Test users</strong> or the
          flow can fail after you pick an account.
        </li>
        <li>
          Under <strong>Credentials</strong> → your Web client → <strong>Authorized redirect URIs</strong>, include{" "}
          <em>both</em> if you use them:{" "}
          <code className="rounded bg-slate-200/80 px-1 font-mono text-[11px] dark:bg-slate-800">
            http://localhost:3000/api/auth/callback/google
          </code>{" "}
          and{" "}
          <code className="rounded bg-slate-200/80 px-1 font-mono text-[11px] dark:bg-slate-800">
            http://127.0.0.1:3000/api/auth/callback/google
          </code>{" "}
          (match your port).
        </li>
        <li>
          In <code className="font-mono text-[11px]">.env</code>, set{" "}
          <code className="font-mono text-[11px]">AUTH_URL</code> to the same origin you type in the address bar
          (including <code className="font-mono text-[11px]">localhost</code> vs{" "}
          <code className="font-mono text-[11px]">127.0.0.1</code> and port).
        </li>
      </ul>
    </details>
  );
}
