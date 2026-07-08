import { formatBusinessLocation } from "@/lib/format-business-location";
import type { DemoWebsiteSpec } from "@/lib/demo-website/spec";
import { FONT_PAIRS } from "@/lib/demo-website/spec";
import type { DemoWebsiteContext, DemoWebsiteInput } from "@/lib/demo-website/types";

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function telHref(phone?: string | null): string {
  const digits = phone?.replace(/\D/g, "") ?? "";
  return digits ? `tel:+${digits.startsWith("1") ? digits : `1${digits}`}` : "#contact";
}

export function starRow(rating: number, light = false): string {
  const r = Math.min(5, Math.max(0, rating));
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  const empty = light ? "text-black/20" : "text-amber-200/40";
  const filled = light ? "text-amber-500" : "text-amber-400";
  let html = "";
  for (let i = 0; i < 5; i++) {
    const on = i < full || (i === full && half);
    html += `<svg class="h-4 w-4 ${on ? filled : empty}" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
  }
  return html;
}

export function buildContext(input: DemoWebsiteInput): DemoWebsiteContext {
  const location = formatBusinessLocation({
    city: input.city,
    state: input.state,
    address: input.address,
  });
  const phone = input.phone?.trim() ?? "";
  return {
    ...input,
    nameEsc: escapeHtml(input.name.trim() || "Your Business"),
    location: escapeHtml(location),
    addressLine: escapeHtml(input.address?.trim() || location),
    phone,
    phoneDisplay: escapeHtml(phone || "Call for hours"),
    tel: telHref(phone),
    heroImage: escapeHtml(input.photoUrl?.trim() || ""),
    mapsUrl: escapeHtml(input.googleMapsUrl?.trim() || "#contact"),
    rating: input.rating ?? null,
    reviews: input.reviewCount ?? 0,
    year: new Date().getFullYear(),
  };
}

export function pageHead(
  ctx: DemoWebsiteContext,
  spec: DemoWebsiteSpec,
  extraCss = ""
): string {
  const fonts = FONT_PAIRS[spec.fontPairId % FONT_PAIRS.length] ?? FONT_PAIRS[0];
  const c = spec.colors;
  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${ctx.nameEsc} | ${escapeHtml(spec.categoryLabel)}</title>
  <meta name="description" content="${escapeHtml(spec.tagline)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${fonts.url}" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --brand: ${c.primary};
      --brand-dark: ${c.primaryDark};
      --accent: ${c.accent};
      --bg: ${c.background};
      --surface: ${c.surface};
      --text: ${c.text};
      --muted: ${c.muted};
    }
    body { font-family: '${fonts.body}', system-ui, sans-serif; background: var(--bg); color: var(--text); }
    .font-display { font-family: '${fonts.display}', Georgia, serif; }
    .text-balance { text-wrap: balance; }
    ${extraCss}
  </style>
</head>`;
}

export function ratingBadge(ctx: DemoWebsiteContext, dark = false): string {
  if (ctx.rating == null && ctx.reviews === 0) return "";
  const stars = starRow(ctx.rating ?? 5, !dark);
  const text = dark ? "text-white/80" : "text-[var(--muted)]";
  return `<div class="flex flex-wrap items-center gap-2 text-sm ${text}">
    <span class="flex gap-0.5">${stars}</span>
    ${ctx.rating != null ? `<span class="font-semibold">${ctx.rating.toFixed(1)}</span>` : ""}
    ${ctx.reviews > 0 ? `<span>· ${ctx.reviews.toLocaleString()} reviews</span>` : ""}
  </div>`;
}

export function servicesBlock(
  spec: DemoWebsiteSpec,
  variant: "cards" | "list" | "bento" | "minimal"
): string {
  if (variant === "cards") {
    return spec.services
      .map(
        (s, i) => `
        <article class="rounded-3xl border border-black/5 bg-[var(--surface)] p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
          <p class="text-xs font-bold uppercase tracking-widest" style="color:var(--accent)">0${i + 1}</p>
          <h3 class="mt-4 text-2xl font-semibold">${escapeHtml(s.title)}</h3>
          <p class="mt-3 leading-relaxed text-[var(--muted)]">${escapeHtml(s.description)}</p>
        </article>`
      )
      .join("");
  }
  if (variant === "bento") {
    return spec.services
      .map(
        (s, i) => `
        <article class="rounded-[2rem] p-8 ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}" style="background:linear-gradient(145deg, var(--surface), color-mix(in srgb, var(--accent) 8%, var(--surface)))">
          <h3 class="text-xl font-bold md:text-2xl">${escapeHtml(s.title)}</h3>
          <p class="mt-3 leading-relaxed text-[var(--muted)]">${escapeHtml(s.description)}</p>
        </article>`
      )
      .join("");
  }
  if (variant === "minimal") {
    return spec.services
      .map(
        (s) => `
        <div class="border-t border-black/10 py-8 first:border-t-0 first:pt-0">
          <h3 class="text-xl font-medium">${escapeHtml(s.title)}</h3>
          <p class="mt-2 max-w-xl leading-relaxed text-[var(--muted)]">${escapeHtml(s.description)}</p>
        </div>`
      )
      .join("");
  }
  return spec.services
    .map(
      (s, i) => `
      <div class="flex gap-6">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style="background:var(--accent)">${i + 1}</div>
        <div>
          <h3 class="text-lg font-semibold">${escapeHtml(s.title)}</h3>
          <p class="mt-1 text-[var(--muted)]">${escapeHtml(s.description)}</p>
        </div>
      </div>`
    )
    .join("");
}

export function testimonialsBlock(spec: DemoWebsiteSpec, dark = false): string {
  const bg = dark ? "bg-white/5 border-white/10" : "bg-[var(--surface)] border-black/5";
  const quote = dark ? "text-white/90" : "text-[var(--text)]";
  const src = dark ? "text-white/50" : "text-[var(--muted)]";
  return spec.testimonials
    .map(
      (t) => `
      <blockquote class="rounded-3xl border p-8 ${bg}">
        <p class="text-lg leading-relaxed ${quote}">"${escapeHtml(t.quote)}"</p>
        <footer class="mt-4 text-sm font-medium ${src}">— ${escapeHtml(t.source)}</footer>
      </blockquote>`
    )
    .join("");
}

export function contactBlock(ctx: DemoWebsiteContext, spec: DemoWebsiteSpec, dark = false): string {
  const cardBg = dark ? "bg-white/5" : "bg-[var(--surface)]";
  const text = dark ? "text-white" : "text-[var(--text)]";
  const muted = dark ? "text-white/70" : "text-[var(--muted)]";
  return `
  <section id="contact" class="py-20 px-6">
    <div class="mx-auto max-w-5xl overflow-hidden rounded-[2rem] shadow-2xl" style="background:linear-gradient(135deg,var(--brand-dark),var(--brand))">
      <div class="grid lg:grid-cols-5">
        <div class="lg:col-span-3 p-10 sm:p-14 text-white">
          <p class="text-xs font-bold uppercase tracking-[0.25em] text-white/50">${escapeHtml(spec.sectionTitles.contact)}</p>
          <h2 class="font-display mt-4 text-4xl font-semibold text-balance">Let's work with ${ctx.nameEsc}</h2>
          <div class="mt-8 space-y-3 text-lg">
            ${ctx.phone ? `<a href="${ctx.tel}" class="block font-semibold hover:underline">${ctx.phoneDisplay}</a>` : ""}
            <p class="${muted.replace("text-[var(--muted)]", "text-white/75")}">${ctx.addressLine}</p>
            <p class="text-white/75">${ctx.location}</p>
          </div>
          <div class="mt-10 flex flex-wrap gap-3">
            ${ctx.phone ? `<a href="${ctx.tel}" class="rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900">${escapeHtml(spec.ctaPrimary)}</a>` : ""}
            <a href="${ctx.mapsUrl}" target="_blank" rel="noopener noreferrer" class="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold hover:bg-white/10">${escapeHtml(spec.ctaSecondary)}</a>
          </div>
        </div>
        <div class="${cardBg} lg:col-span-2 p-10 sm:p-14 ${text}">
          <p class="text-xs font-bold uppercase tracking-widest ${muted}">Hours</p>
          <ul class="mt-4 space-y-3">
            <li class="flex justify-between gap-4"><span>Mon – Fri</span><span>8 AM – 6 PM</span></li>
            <li class="flex justify-between gap-4"><span>Saturday</span><span>9 AM – 4 PM</span></li>
            <li class="flex justify-between gap-4"><span>Sunday</span><span>Closed</span></li>
          </ul>
        </div>
      </div>
    </div>
  </section>`;
}

export function footerBlock(ctx: DemoWebsiteContext): string {
  return `
  <footer class="border-t border-black/5 py-12 text-center text-sm text-[var(--muted)]">
    <p class="font-display text-xl font-semibold text-[var(--text)]">${ctx.nameEsc}</p>
    <p class="mt-2">${ctx.location}${ctx.phone ? ` · ${ctx.phoneDisplay}` : ""}</p>
    <p class="mt-6">© ${ctx.year} ${ctx.nameEsc}</p>
  </footer>`;
}

export function heroImage(ctx: DemoWebsiteContext, spec: DemoWebsiteSpec): string {
  return ctx.heroImage || spec.galleryImages[0] || "";
}
