import { getDemoPage } from "@/actions/demo";
import { renderStoredDemoHtml } from "@/lib/demo-templates/render-demo-page";
import { NextResponse } from "next/server";

/** Serve demo HTML — re-rendered from portfolio template + current Google business data. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const demo = await getDemoPage(slug);
  if (!demo) {
    return new NextResponse("Not found", { status: 404 });
  }

  const html = await renderStoredDemoHtml(demo.htmlContent, demo.lead?.business);

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
