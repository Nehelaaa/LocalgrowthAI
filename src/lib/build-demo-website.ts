import { renderPortfolioTemplate } from "@/lib/demo-templates/render-portfolio-template";
import type { DemoWebsiteInput } from "@/lib/demo-website/types";

export type { DemoWebsiteInput } from "@/lib/demo-website/types";

/** Build demo HTML — portfolio template when available, otherwise generated layout. */
export async function buildDemoWebsiteHtml(
  input: DemoWebsiteInput,
  templateId?: string | null
): Promise<string> {
  const portfolio = await renderPortfolioTemplate(input, templateId);
  if (portfolio) return portfolio;

  const { createDemoWebsiteSpec } = await import("@/lib/demo-website/spec");
  const { renderDemoWebsite } = await import("@/lib/demo-website/layouts");
  const { buildContext } = await import("@/lib/demo-website/utils");
  const ctx = buildContext(input);
  const spec = await createDemoWebsiteSpec(input);
  return renderDemoWebsite(ctx, spec);
}
