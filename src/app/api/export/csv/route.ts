import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-user";
import { mustUpgradeForProFeatures } from "@/lib/entitlements";
import { rateLimitOr429, safeErrorMessage } from "@/lib/api-security";

function escapeCsv(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n"))
    return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rl = rateLimitOr429(request, "export_csv");
    if (rl) return rl;

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
    "Service price",
    "Follow-up Date",
    "POC Name",
    "POC Phone",
    "POC Email",
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
    l.pocName ?? "",
    l.pocPhone ?? "",
    l.pocEmail ?? "",
    (l.tags ? (JSON.parse(l.tags) as string[]).join("; ") : ""),
  ]);

  const csv =
    headers.map(escapeCsv).join(",") +
    "\n" +
    rows.map((r) => r.map((c) => escapeCsv(String(c))).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="localleadster-leads.csv"`,
      },
    });
  } catch (e) {
    console.error("[api/export/csv]", e);
    return NextResponse.json({ error: safeErrorMessage() }, { status: 500 });
  }
}
