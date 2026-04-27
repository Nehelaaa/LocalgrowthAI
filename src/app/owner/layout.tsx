import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";
import { AdminShell } from "./AdminShell";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await requireOwnerOrRedirect();
  const imp = (await cookies()).get("lg_impersonate")?.value ?? null;
  const impersonating = imp
    ? await prisma.user.findUnique({
        where: { id: imp },
        select: { id: true, email: true },
      })
    : null;

  return (
    <AdminShell
      ownerEmail={s.user.email}
      impersonating={impersonating ? { userId: impersonating.id, email: impersonating.email } : null}
    >
      {children}
    </AdminShell>
  );
}

