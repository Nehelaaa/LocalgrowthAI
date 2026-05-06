"use client";

import Link from "next/link";

export function ContactSupportPanel() {
  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
          Sign in
        </Link>{" "}
        and use{" "}
        <span className="font-medium text-slate-800 dark:text-slate-200">Contact support</span> in the
        sidebar for the full form (including attachments).
      </p>
    </div>
  );
}
