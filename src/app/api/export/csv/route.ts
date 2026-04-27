import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-user";
import { mustUpgradeForProFeatures } from "@/lib/entitlements";

function escapeCsv(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n"))
    return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getCurrentUser();
  if (!user || mustUpgradeForProFeatures(user)) {
    return NextResponse.json(
      { error: "Pro subscription required for export" },
      { status: 403 }
    );
  }
  const leads = await prisma.lead.findMany({
    where: { userId: user.id },
    include: { business: true },
    orderBy: [{ leadScore: "desc" }, { createdAt: "desc" }],
  });

  const headers = [
    "Business Name",
    "Address",
    "City",
    "State",
    "Phone",
    "Website",
    "Rating",
    "Review Count",
    "Lead Score",
    "Badge",
    "Contact Status",
    "Notes",
    "Website price",
    "Follow-up Date",
    "Tags",
  ];
  const rows = leads.map((l) => [
    l.business.name,
    l.business.address ?? "",
    l.business.city ?? "",
    l.business.state ?? "",
    l.business.phone ?? "",
    l.business.website ?? "",
    l.business.rating ?? "",
    l.business.reviewCount,
    l.leadScore,
    l.badge,
    l.contactStatus,
    l.notes ?? "",
    l.websiteQuote ?? "",
    l.followUpDate ? new Date(l.followUpDate).toISOString().slice(0, 10) : "",
    (l.tags ? (JSON.parse(l.tags) as string[]).join("; ") : ""),
  ]);

  const csv =
    headers.map(escapeCsv).join(",") +
    "\n" +
    rows.map((r) => r.map((c) => escapeCsv(String(c))).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="localgrowth-leads.csv"`,
    },
  });
}
