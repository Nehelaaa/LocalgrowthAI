"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/session-user";
import { isTradesProfession } from "@/lib/profession";
import { saveManualCrmLeadForPipeline } from "@/actions/leads";

const JOB_STATUSES = [
  "new_call",
  "scheduled",
  "in_progress",
  "done",
  "cancelled",
] as const;
const jobStatus = z.enum(JOB_STATUSES);

function assertTradesUser() {
  return requireUserForAction().then((u) => {
    if (!isTradesProfession(u.profession)) {
      throw new Error("FORBIDDEN");
    }
    return u;
  });
}

const customerCreate = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(3).max(40),
  notes: z.string().max(5000).optional(),
  issues: z.string().max(5000).optional(),
});

const customerUpdate = customerCreate.extend({ id: z.string().min(1) });

const jobCreate = z.object({
  customerId: z.string().min(1),
  jobType: z.string().min(1).max(500),
  status: jobStatus.default("new_call"),
  priceCents: z.coerce.number().int().min(0).max(100_000_000),
  paid: z.coerce.boolean().default(false),
  notes: z.string().max(5000).optional().nullable(),
});

export type TradesActionState = {
  error?: string;
  success?: boolean;
  /** Call/customer was saved, but the CRM add failed (e.g. free lead limit). */
  crmError?: string;
};
const ok: TradesActionState = { success: true };

function rev() {
  revalidatePath("/dashboard/trades");
  revalidatePath("/dashboard/trades/calls");
  revalidatePath("/dashboard/trades/schedule");
  revalidatePath("/dashboard/trades/customers");
}

/** New call: create customer + job in one step (fast path for phone leads). */
export async function createTradesCallQuick(
  _prev: TradesActionState,
  formData: FormData
): Promise<TradesActionState> {
  const u = await assertTradesUser();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const jobType = String(formData.get("jobType") ?? "").trim();
  const st = jobStatus.safeParse(
    String(formData.get("status") ?? "new_call") || "new_call"
  );
  if (!st.success) return { error: "Invalid status." };
  const c = customerCreate.safeParse({ name, phone });
  if (!c.success || !jobType) {
    return { error: "Name, phone, and what they need (job) are required." };
  }
  const schedRaw = String(formData.get("scheduledAt") ?? "").trim();
  let sched: Date | null = null;
  if (schedRaw.length > 0) {
    const t = new Date(schedRaw);
    if (!Number.isNaN(t.getTime())) sched = t;
  }
  const priceStr = String(formData.get("priceDollars") ?? "0").replace(
    /[$,]/g,
    ""
  );
  const priceCents = Math.round((parseFloat(priceStr) || 0) * 100);

  await prisma.$transaction(async (tx) => {
    const cust = await tx.tradesCustomer.create({
      data: { userId: u.id, name: c.data.name, phone: c.data.phone },
    });
    await tx.tradesJob.create({
      data: {
        userId: u.id,
        customerId: cust.id,
        jobType,
        status: st.data,
        priceCents,
        paid: false,
        scheduledAt: sched,
        notes: null,
      },
    });
  });
  rev();

  const addCrm = formData.get("addCrmLead") === "on";
  if (addCrm) {
    const crmName = String(
      formData.get("crmBusinessName") ?? ""
    ).trim() || c.data.name;
    const r = await saveManualCrmLeadForPipeline({
      businessName: crmName,
      phone,
      businessTypeLabel: "Field service / side work",
      notesLine: `Trades job: ${jobType}`.slice(0, 5000),
    });
    if (r.ok) {
      revalidatePath("/dashboard/leads");
    } else if (r.code === "LEAD_LIMIT") {
      return {
        success: true,
        crmError:
          "Call saved, but the CRM is at the lead limit. Upgrade to Pro for unlimited marketing leads, or make room in your pipeline.",
      };
    }
  }

  return { success: true };
}

export async function createTradesCustomer(
  _prev: TradesActionState,
  formData: FormData
): Promise<TradesActionState> {
  const u = await assertTradesUser();
  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    notes: (() => {
      const v = formData.get("notes");
      if (v == null || v === "") return undefined;
      return String(v);
    })(),
    issues: (() => {
      const v = formData.get("issues");
      if (v == null || v === "") return undefined;
      return String(v);
    })(),
  };
  const p = customerCreate.safeParse(raw);
  if (!p.success) {
    return { error: "Check name and phone." };
  }
  await prisma.tradesCustomer.create({ data: { userId: u.id, ...p.data } });
  rev();

  if (formData.get("addCrmLead") === "on") {
    const crmName = String(
      formData.get("crmBusinessName") ?? ""
    ).trim() || p.data.name;
    const noteParts = [p.data.notes, p.data.issues].filter(Boolean);
    const r = await saveManualCrmLeadForPipeline({
      businessName: crmName,
      phone: p.data.phone,
      businessTypeLabel: "Trades customer",
      notesLine:
        (noteParts.length
          ? `From Trades: ${noteParts.join(" | ")}`
          : "Added from Trades customers"
        ).slice(0, 5000),
    });
    if (r.ok) {
      revalidatePath("/dashboard/leads");
    } else if (r.code === "LEAD_LIMIT") {
      return {
        success: true,
        crmError:
          "Customer saved, but the CRM is at the lead limit. Upgrade to Pro for unlimited marketing leads.",
      };
    }
  }

  return { success: true };
}

export async function updateTradesCustomer(
  _prev: TradesActionState,
  formData: FormData
): Promise<TradesActionState> {
  const u = await assertTradesUser();
  const raw = {
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    notes: (() => {
      const v = formData.get("notes");
      if (v == null) return undefined;
      return v === "" ? null : String(v);
    })(),
    issues: (() => {
      const v = formData.get("issues");
      if (v == null) return undefined;
      return v === "" ? null : String(v);
    })(),
  };
  const p = customerUpdate.safeParse(raw);
  if (!p.success) return { error: "Invalid customer." };
  const row = await prisma.tradesCustomer.findFirst({
    where: { id: p.data.id, userId: u.id },
  });
  if (!row) return { error: "Not found." };
  const { id, ...rest } = p.data;
  await prisma.tradesCustomer.update({ where: { id }, data: rest });
  rev();
  return ok;
}

export async function createTradesJob(
  _prev: TradesActionState,
  formData: FormData
): Promise<TradesActionState> {
  const u = await assertTradesUser();
  const customerId = String(formData.get("customerId") ?? "");
  const cust = await prisma.tradesCustomer.findFirst({
    where: { id: customerId, userId: u.id },
  });
  if (!cust) return { error: "Invalid customer." };

  const schedRaw = String(formData.get("scheduledAt") ?? "").trim();
  const priceStr = String(formData.get("priceDollars") ?? "0").replace(/[$,]/g, "");
  const priceNum = Math.round((parseFloat(priceStr) || 0) * 100);

  const st = jobStatus.safeParse(
    String(formData.get("status") ?? "new_call") || "new_call"
  );
  if (!st.success) return { error: "Invalid status." };

  const raw = {
    customerId,
    jobType: String(formData.get("jobType") ?? "").trim(),
    status: st.data,
    priceCents: priceNum,
    paid: formData.get("paid") === "on" || formData.get("paid") === "true",
    notes: (() => {
      const v = formData.get("jobNotes");
      if (v == null || v === "") return null;
      return String(v);
    })(),
  };
  const p = jobCreate.safeParse(raw);
  if (!p.success) return { error: "Check job type and price." };
  let sched: Date | null = null;
  if (schedRaw.length > 0) {
    const t = new Date(schedRaw);
    if (!Number.isNaN(t.getTime())) sched = t;
  }
  await prisma.tradesJob.create({
    data: {
      userId: u.id,
      customerId: p.data.customerId,
      jobType: p.data.jobType,
      status: p.data.status,
      priceCents: p.data.priceCents,
      paid: p.data.paid,
      notes: p.data.notes,
      scheduledAt: sched,
    },
  });
  rev();
  return ok;
}

export async function updateTradesJob(
  _prev: TradesActionState,
  formData: FormData
): Promise<TradesActionState> {
  const u = await assertTradesUser();
  const id = String(formData.get("id") ?? "");
  const row = await prisma.tradesJob.findFirst({
    where: { id, userId: u.id },
  });
  if (!row) return { error: "Not found." };

  const jobType = String(formData.get("jobType") ?? row.jobType).trim() || row.jobType;
  const st = jobStatus.safeParse(
    String(formData.get("status") ?? row.status) || row.status
  );
  if (!st.success) return { error: "Invalid status." };

  const priceStr = String(
    formData.get("priceDollars") ?? (row.priceCents / 100).toString()
  );
  const priceCents = Math.round(
    (parseFloat(priceStr.replace(/[$,]/g, "")) || 0) * 100
  );

  const paid =
    formData.get("paid") === "on" || formData.get("paid") === "true";
  const notesV = formData.get("jobNotes");
  const notes =
    notesV == null
      ? row.notes
      : notesV === ""
        ? null
        : String(notesV);

  const schedRaw = String(formData.get("scheduledAt") ?? "");
  let newScheduled: Date | null | undefined;
  if (formData.has("scheduledAt")) {
    if (!schedRaw.trim()) {
      newScheduled = null;
    } else {
      const t = new Date(schedRaw);
      newScheduled = Number.isNaN(t.getTime()) ? row.scheduledAt : t;
    }
  }

  await prisma.tradesJob.update({
    where: { id },
    data: {
      jobType,
      status: st.data,
      priceCents,
      paid,
      notes,
      ...(newScheduled !== undefined && { scheduledAt: newScheduled }),
    },
  });
  rev();
  return ok;
}

export async function rescheduleTradesJob(
  _prev: TradesActionState,
  formData: FormData
): Promise<TradesActionState> {
  const u = await assertTradesUser();
  const id = String(formData.get("id") ?? "");
  const tStr = String(formData.get("scheduledAt") ?? "");
  const t = new Date(tStr);
  if (!tStr.trim() || Number.isNaN(t.getTime())) {
    return { error: "Pick a date and time." };
  }
  const row = await prisma.tradesJob.findFirst({
    where: { id, userId: u.id },
  });
  if (!row) return { error: "Not found." };
  await prisma.tradesJob.update({
    where: { id },
    data: { scheduledAt: t, status: "scheduled" },
  });
  rev();
  return ok;
}

export async function getTradesDashboardData() {
  const u = await requireUserForAction();
  if (!isTradesProfession(u.profession)) {
    throw new Error("FORBIDDEN");
  }
  const now = new Date();
  const startWeek = new Date(now);
  startWeek.setDate(now.getDate() - now.getDay());
  startWeek.setHours(0, 0, 0, 0);
  const endWeek = new Date(startWeek);
  endWeek.setDate(startWeek.getDate() + 7);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [weekJobs, monthRevenue, pendingPayment] = await Promise.all([
    prisma.tradesJob.findMany({
      where: {
        userId: u.id,
        status: { not: "cancelled" },
        OR: [
          { scheduledAt: { gte: startWeek, lt: endWeek } },
          {
            scheduledAt: null,
            createdAt: { gte: startWeek, lt: endWeek },
          },
        ],
      },
      include: { customer: true },
    }),
    prisma.tradesJob.aggregate({
      where: {
        userId: u.id,
        status: { in: ["done", "in_progress", "scheduled"] },
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { priceCents: true },
    }),
    prisma.tradesJob.findMany({
      where: {
        userId: u.id,
        paid: false,
        priceCents: { gt: 0 },
        status: { in: ["done", "in_progress", "scheduled"] },
      },
      include: { customer: true },
      take: 20,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    jobsThisWeekCount: weekJobs.length,
    revenueThisMonthCents: monthRevenue._sum.priceCents ?? 0,
    pendingPayment,
  };
}

export async function getTradesJobForUser(jobId: string) {
  const u = await requireUserForAction();
  if (!isTradesProfession(u.profession)) {
    return null;
  }
  return prisma.tradesJob.findFirst({
    where: { id: jobId, userId: u.id },
    include: { customer: true, user: true },
  });
}

export async function listTradesJobsInRange(start: Date, end: Date) {
  const u = await requireUserForAction();
  if (!isTradesProfession(u.profession)) throw new Error("FORBIDDEN");
  return prisma.tradesJob.findMany({
    where: {
      userId: u.id,
      OR: [
        { scheduledAt: { gte: start, lt: end } },
        {
          scheduledAt: null,
          createdAt: { gte: start, lt: end },
        },
      ],
    },
    include: { customer: true },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
  });
}
