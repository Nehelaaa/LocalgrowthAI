import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-user";
import { mustUpgradeForProFeatures } from "@/lib/entitlements";
import { rateLimitOr429, safeErrorMessage } from "@/lib/api-security";
import { resolveGoogleMapsListingUrl } from "@/lib/google-maps-links";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rl = rateLimitOr429(request, "export_leads");
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

  const payload = leads.map((l) => ({
    id: l.id,
    leadScore: l.leadScore,
    badge: l.badge,
    contactStatus: l.contactStatus,
    notes: l.notes,
    websiteQuote: l.websiteQuote,
    followUpDate: l.followUpDate?.toISOString(),
    tags: l.tags ? (JSON.parse(l.tags) as string[]) : [],
    business: {
      name: l.business.name,
      address: l.business.address,
      city: l.business.city,
      state: l.business.state,
      phone: l.business.phone,
      website: l.business.website,
      rating: l.business.rating,
      reviewCount: l.business.reviewCount,
      googleMapsUrl:
        resolveGoogleMapsListingUrl({
          placeId: l.business.placeId,
          name: l.business.name,
          address: l.business.address,
          city: l.business.city,
          state: l.business.state,
          lat: l.business.lat,
          lng: l.business.lng,
          googleMapsUrl: l.business.googleMapsUrl,
        }) ?? l.business.googleMapsUrl,
    },
  }));

    return NextResponse.json({ leads: payload });
  } catch (e) {
    console.error("[api/export/leads]", e);
    return NextResponse.json({ error: safeErrorMessage() }, { status: 500 });
  }
}
