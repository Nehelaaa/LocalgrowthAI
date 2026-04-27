import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Access denied</h1>
        <p className="text-slate-400 mb-6">
          You don’t have access to this area.
        </p>
        <Link
          href="/"
          className="text-indigo-400 hover:text-indigo-300 font-medium"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
