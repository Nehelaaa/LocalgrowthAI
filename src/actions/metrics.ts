"use server";

import { deriveCityCentroids, resolveCityCoordinates } from "@/lib/city-centroids";
import { extractCityState } from "@/lib/google-places";
import { parseWebsitePrice } from "@/lib/parse-website-price";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/session-user";
import type { ContactStatus, LeadBadge } from "@prisma/client";

export type DashboardLeadRow = {
  id: string;
  businessName: string;
  city: string | null;
  state: string | null;
  address: string | null;
  hasWebsite: boolean;
  hasSocialOnly: boolean;
  rating: number | null;
  reviewCount: number;
  contactStatus: ContactStatus;
  leadScore: number;
  badge: LeadBadge;
  phone: string | null;
  followUpDate: Date | null;
  updatedAt: Date;
};

export type DashboardActivityItem = {
  id: string;
  message: string;
  time: Date;
  leadId?: string;
};

export type DashboardCityPin = {
  city: string;
  count: number;
};

export type DashboardCityMapPin = {
  city: string;
  count: number;
  lat: number;
  lng: number;
};

export type DashboardMapMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  city: string | null;
  count: number;
};

export type DashboardMapStats = {
  activeLeads: number;
  onMap: number;
  withCoords: number;
  withCityOnly: number;
  unmapped: number;
  cityCount: number;
};

export type DashboardFollowUp = {
  id: string;
  businessName: string;
  followUpDate: Date;
  contactStatus: ContactStatus;
};

function normalizeCityName(city: string | null | undefined): string | null {
  if (!city) return null;
  const trimmed = city.trim();
  if (!trimmed) return null;
  if (/^\d+\s/.test(trimmed)) return null;
  if (/\b(floor|suite|ste|unit|apt|building|bldg|#)\b/i.test(trimmed)) return null;
  if (/\b\d+(st|nd|rd|th)\b/i.test(trimmed)) return null;
  if (
    /\d/.test(trimmed) &&
    /\b(st|street|ste|suite|ave|avenue|rd|road|blvd|dr|drive|ln|lane|way|ct|court|pl|place)\b/i.test(
      trimmed
    )
  ) {
    return null;
  }
  return trimmed;
}

function hasValidCoords(lat: number | null | undefined, lng: number | null | undefined): boolean {
  return lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
}

type LeadForMap = {
  id: string;
  business: {
    name: string;
    city: string | null;
    state: string | null;
    address: string | null;
    lat: number | null;
    lng: number | null;
  };
};

function looksLikeStreet(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^\d+\s/.test(trimmed)) return true;
  if (/\b(floor|suite|ste|unit|apt|building|bldg|#)\b/i.test(trimmed)) return true;
  if (/\b\d+(st|nd|rd|th)\b/i.test(trimmed)) return true;
  if (
    /\d/.test(trimmed) &&
    /\b(st|street|ste|suite|ave|avenue|rd|road|blvd|dr|drive|ln|lane|way|ct|court|pl|place)\b/i.test(
      trimmed
    )
  ) {
    return true;
  }
  return false;
}

function resolveLeadCity(business: LeadForMap["business"]): string | null {
  const rawCity = business.city?.trim() ?? "";

  if (business.address) {
    const { city } = extractCityState(business.address);
    const fromAddress = normalizeCityName(city);
    if (fromAddress && (!rawCity || looksLikeStreet(rawCity) || !normalizeCityName(rawCity))) {
      return fromAddress;
    }
  }

  return normalizeCityName(rawCity);
}

function buildMapData(leads: LeadForMap[]): {
  mapMarkers: DashboardMapMarker[];
  mapCities: DashboardCityPin[];
  mapCityPins: DashboardCityMapPin[];
  mapStats: DashboardMapStats;
} {
  const derivedCentroids = deriveCityCentroids(
    leads.flatMap((l) => {
      const city = resolveLeadCity(l.business);
      if (!city || !hasValidCoords(l.business.lat, l.business.lng)) return [];
      return [{ city, lat: l.business.lat!, lng: l.business.lng! }];
    })
  );

  const cityOnlyCounts = new Map<string, { count: number; state: string | null }>();
  const markers: DashboardMapMarker[] = [];
  let withCoords = 0;
  let withCityOnly = 0;
  let unmapped = 0;

  for (const l of leads) {
    const { lat, lng } = l.business;
    if (hasValidCoords(lat, lng)) {
      withCoords += 1;
      markers.push({
        id: l.id,
        lat: lat!,
        lng: lng!,
        label: l.business.name,
        city: resolveLeadCity(l.business),
        count: 1,
      });
      continue;
    }

    const city = resolveLeadCity(l.business);
    if (!city) {
      unmapped += 1;
      continue;
    }

    withCityOnly += 1;
    const prev = cityOnlyCounts.get(city);
    cityOnlyCounts.set(city, {
      count: (prev?.count ?? 0) + 1,
      state: l.business.state ?? prev?.state ?? null,
    });
  }

  for (const [city, { count, state }] of cityOnlyCounts) {
    const coords = resolveCityCoordinates(city, state, derivedCentroids);
    if (!coords) {
      unmapped += count;
      withCityOnly -= count;
      continue;
    }
    markers.push({
      id: `city:${city}`,
      lat: coords.lat,
      lng: coords.lng,
      label: city,
      city,
      count,
    });
  }

  const cityCountMap = new Map<string, number>();
  for (const l of leads) {
    const city = resolveLeadCity(l.business);
    if (city) cityCountMap.set(city, (cityCountMap.get(city) ?? 0) + 1);
  }

  const mapCities = [...cityCountMap.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([city, count]) => ({ city, count }));

  const cityCoordSums = new Map<string, { latSum: number; lngSum: number; n: number }>();
  for (const l of leads) {
    const city = resolveLeadCity(l.business);
    if (!city || !hasValidCoords(l.business.lat, l.business.lng)) continue;
    const prev = cityCoordSums.get(city) ?? { latSum: 0, lngSum: 0, n: 0 };
    cityCoordSums.set(city, {
      latSum: prev.latSum + l.business.lat!,
      lngSum: prev.lngSum + l.business.lng!,
      n: prev.n + 1,
    });
  }

  const mapCityPins: DashboardCityMapPin[] = mapCities.flatMap(({ city, count }) => {
    const summed = cityCoordSums.get(city);
    if (summed) {
      return [
        {
          city,
          count,
          lat: summed.latSum / summed.n,
          lng: summed.lngSum / summed.n,
        },
      ];
    }
    const fallback = resolveCityCoordinates(city, null, derivedCentroids);
    if (!fallback) return [];
    return [{ city, count, lat: fallback.lat, lng: fallback.lng }];
  });

  const onMap = withCoords + withCityOnly;

  return {
    mapMarkers: markers,
    mapCities,
    mapCityPins,
    mapStats: {
      activeLeads: leads.length,
      onMap,
      withCoords,
      withCityOnly,
      unmapped,
      cityCount: mapCities.length,
    },
  };
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function mapLeadRow(l: {
  id: string;
  contactStatus: ContactStatus;
  leadScore: number;
  badge: LeadBadge;
  followUpDate: Date | null;
  updatedAt: Date;
  business: {
    name: string;
    city: string | null;
    state: string | null;
    address: string | null;
    website: string | null;
    hasSocialOnly: boolean;
    rating: number | null;
    reviewCount: number;
    phone: string | null;
  };
}): DashboardLeadRow {
  return {
    id: l.id,
    businessName: l.business.name,
    city: l.business.city,
    state: l.business.state,
    address: l.business.address,
    hasWebsite: Boolean(l.business.website) && !l.business.hasSocialOnly,
    hasSocialOnly: l.business.hasSocialOnly,
    rating: l.business.rating,
    reviewCount: l.business.reviewCount,
    contactStatus: l.contactStatus,
    leadScore: l.leadScore,
    badge: l.badge,
    phone: l.business.phone,
    followUpDate: l.followUpDate,
    updatedAt: l.updatedAt,
  };
}

async function fetchLeadBundle(userId: string) {
  return prisma.lead.findMany({
    where: { userId },
    include: { business: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
}

export async function getDashboardMetrics() {
  return getDashboardData();
}

export async function getDashboardData() {
  const user = await requireUserForAction();
  const forUser = { userId: user.id } as const;
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const [
    totalLeads,
    noWebsite,
    contacts,
    statusCounts,
    wonLeads,
    hotLeads,
    leadBundle,
    todayFollowUpRows,
    hotLeadRows,
    recentOutreach,
    activeQuotedLeads,
    activeLeadsForMap,
  ] = await Promise.all([
    prisma.lead.count({ where: forUser }),
    prisma.lead.count({
      where: {
        userId: user.id,
        contactStatus: { not: "CLOSED_LOST" },
        business: { is: { OR: [{ website: null }, { hasSocialOnly: true }] } },
      },
    }),
    prisma.lead.count({
      where: {
        userId: user.id,
        contactStatus: { in: ["CONTACTED", "INTERESTED", "CLOSED_WON", "CLOSED_LOST"] },
      },
    }),
    prisma.lead.groupBy({
      by: ["contactStatus"],
      where: forUser,
      _count: true,
    }),
    prisma.lead.findMany({
      where: { userId: user.id, contactStatus: "CLOSED_WON" },
      select: { websiteQuote: true },
    }),
    prisma.lead.count({
      where: { userId: user.id, badge: "HOT", contactStatus: { not: "CLOSED_LOST" } },
    }),
    fetchLeadBundle(user.id),
    prisma.lead.findMany({
      where: {
        userId: user.id,
        followUpDate: { gte: todayStart, lte: todayEnd },
        contactStatus: { not: "CLOSED_LOST" },
      },
      include: { business: true },
      orderBy: { followUpDate: "asc" },
      take: 12,
    }),
    prisma.lead.findMany({
      where: {
        userId: user.id,
        badge: "HOT",
        contactStatus: { not: "CLOSED_LOST" },
      },
      include: { business: true },
      orderBy: { leadScore: "desc" },
      take: 6,
    }),
    prisma.outreach.findMany({
      where: { lead: { userId: user.id } },
      include: { lead: { include: { business: true } } },
      orderBy: { generatedAt: "desc" },
      take: 8,
    }),
    prisma.lead.findMany({
      where: {
        userId: user.id,
        contactStatus: { in: ["CONTACTED", "INTERESTED"] },
        websiteQuote: { not: null },
      },
      select: { id: true },
    }),
    prisma.lead.findMany({
      where: { userId: user.id, contactStatus: { not: "CLOSED_LOST" } },
      select: {
        id: true,
        business: {
          select: { name: true, city: true, state: true, address: true, lat: true, lng: true },
        },
      },
    }),
  ]);

  const countFor = (status: string) =>
    statusCounts.find((s) => s.contactStatus === status)?._count ?? 0;

  const closedWon = countFor("CLOSED_WON");
  const notInterested = countFor("CLOSED_LOST");
  const activeLeads = totalLeads - notInterested;
  const conversionRate =
    activeLeads > 0 ? Math.round((closedWon / activeLeads) * 100) : 0;

  const closedWonWebsiteValue = wonLeads.reduce(
    (sum, l) => sum + parseWebsitePrice(l.websiteQuote),
    0
  );

  const activePipelineLeads = leadBundle.filter((l) => l.contactStatus !== "CLOSED_LOST");
  const pipelineValue = activePipelineLeads.reduce(
    (sum, l) => sum + parseWebsitePrice(l.websiteQuote),
    0
  );

  const proposalSent = activeQuotedLeads.length;

  // Mutually exclusive pipeline stages — sum equals activeLeads.
  const funnel = {
    new: countFor("NOT_CONTACTED"),
    contacted: countFor("CONTACTED"),
    interested: countFor("INTERESTED"),
    closed: closedWon,
    proposalSent,
  };

  const funnelTotal = funnel.new + funnel.contacted + funnel.interested + funnel.closed;

  const recentLeads = leadBundle
    .filter((l) => l.contactStatus !== "CLOSED_LOST")
    .slice(0, 8)
    .map(mapLeadRow);

  const { mapMarkers, mapCities, mapCityPins, mapStats } = buildMapData(activeLeadsForMap);

  const activityFromLeads: DashboardActivityItem[] = leadBundle.slice(0, 6).map((l) => ({
    id: `lead-${l.id}`,
    message: `${l.business.name} updated — ${stageLabel(l.contactStatus)}`,
    time: l.updatedAt,
    leadId: l.id,
  }));

  const activityFromOutreach: DashboardActivityItem[] = recentOutreach.map((o) => ({
    id: `outreach-${o.id}`,
    message: `Outreach generated for ${o.lead.business.name}`,
    time: o.generatedAt,
    leadId: o.leadId,
  }));

  const recentActivity = [...activityFromOutreach, ...activityFromLeads]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 8);

  return {
    totalLeads,
    activeLeads,
    notInterested,
    noWebsiteCount: noWebsite,
    contactsMade: contacts,
    conversionRate,
    closedWon,
    closedWonWebsiteValue,
    hotLeads,
    pipelineValue,
    funnel,
    funnelTotal,
    pipeline: {
      notContacted: funnel.new,
      contacted: funnel.contacted,
      interested: funnel.interested,
      closedWon,
      closedLost: notInterested,
    },
    recentLeads,
    todayFollowUps: todayFollowUpRows.map((l) => ({
      id: l.id,
      businessName: l.business.name,
      followUpDate: l.followUpDate!,
      contactStatus: l.contactStatus,
    })),
    hotLeadsList: hotLeadRows.map(mapLeadRow),
    recentActivity,
    mapCities,
    mapCityPins,
    mapMarkers,
    mapStats,
  };
}

function stageLabel(status: ContactStatus): string {
  switch (status) {
    case "NOT_CONTACTED":
      return "New";
    case "CONTACTED":
      return "Contacted";
    case "INTERESTED":
      return "Interested";
    case "CLOSED_WON":
      return "Closed";
    case "CLOSED_LOST":
      return "Archived";
    default:
      return status;
  }
}

export type DashboardMetrics = Awaited<ReturnType<typeof getDashboardData>>;
