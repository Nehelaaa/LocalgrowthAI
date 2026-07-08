export async function apiDeleteLead(leadId: string): Promise<void> {
  const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (res.ok) return;
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  throw new Error(data?.error ?? "Could not remove this lead.");
}
