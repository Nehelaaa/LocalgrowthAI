import { getDemoPage } from "@/actions/demo";
import { notFound } from "next/navigation";

export default async function DemoViewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const demo = await getDemoPage(slug);
  if (!demo) notFound();

  return (
    <div
      className="min-h-screen bg-white"
      dangerouslySetInnerHTML={{ __html: demo.htmlContent }}
    />
  );
}
