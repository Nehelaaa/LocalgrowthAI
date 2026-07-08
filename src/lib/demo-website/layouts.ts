import type { DemoWebsiteSpec } from "@/lib/demo-website/spec";
import type { DemoWebsiteContext } from "@/lib/demo-website/types";
import {
  contactBlock,
  footerBlock,
  heroImage,
  pageHead,
  ratingBadge,
  servicesBlock,
  testimonialsBlock,
  escapeHtml,
} from "@/lib/demo-website/utils";

function renderEditorial(ctx: DemoWebsiteContext, spec: DemoWebsiteSpec): string {
  const img = heroImage(ctx, spec);
  const heroTitle = spec.headline ? escapeHtml(spec.headline) : ctx.nameEsc;

  return `${pageHead(ctx, spec, `
    .editorial-hero { min-height: 88vh; }
    @media (min-width: 1024px) { .editorial-grid { grid-template-columns: 1.1fr 0.9fr; } }
  `)}
<body class="antialiased">
  <header class="editorial-hero grid editorial-grid lg:grid-cols-2">
    <div class="flex flex-col justify-center px-8 py-20 lg:px-16 lg:py-28">
      <p class="text-xs font-bold uppercase tracking-[0.3em]" style="color:var(--accent)">${escapeHtml(spec.categoryLabel)}</p>
      <h1 class="font-display mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl text-balance">${heroTitle}</h1>
      <p class="mt-6 max-w-lg text-lg leading-relaxed text-[var(--muted)]">${escapeHtml(spec.tagline)}</p>
      <div class="mt-6">${ratingBadge(ctx)}</div>
      <div class="mt-10 flex flex-wrap gap-4">
        <a href="${ctx.tel}" class="rounded-none px-8 py-4 text-sm font-bold uppercase tracking-wider text-white" style="background:var(--brand)">${escapeHtml(spec.ctaPrimary)}</a>
        <a href="#services" class="border-b-2 border-[var(--text)] pb-1 text-sm font-semibold uppercase tracking-wider">${escapeHtml(spec.ctaSecondary)}</a>
      </div>
    </div>
    <div class="relative min-h-[50vh] lg:min-h-full">
      ${img ? `<img src="${img}" alt="" class="absolute inset-0 h-full w-full object-cover" />` : `<div class="absolute inset-0" style="background:linear-gradient(135deg,var(--brand),var(--accent))"></div>`}
      <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent lg:bg-gradient-to-l"></div>
    </div>
  </header>

  <section class="border-y border-black/5 py-6">
    <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-8 text-sm">
      <span class="font-semibold">${ctx.location}</span>
      <span>${ctx.reviews > 0 ? `${ctx.reviews.toLocaleString()} Google reviews` : "Locally owned"}</span>
      <span>${ctx.rating != null ? `${ctx.rating.toFixed(1)}★ average` : "Trusted service"}</span>
    </div>
  </section>

  <section id="services" class="py-24 px-8">
    <div class="mx-auto max-w-6xl">
      <h2 class="font-display text-4xl font-semibold sm:text-5xl">${escapeHtml(spec.sectionTitles.services)}</h2>
      <div class="mt-16 grid gap-8 md:grid-cols-3">${servicesBlock(spec, "cards")}</div>
    </div>
  </section>

  <section id="about" class="bg-[var(--brand-dark)] py-24 px-8 text-white">
    <div class="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.25em] text-white/50">${escapeHtml(spec.sectionTitles.about)}</p>
        <p class="mt-6 text-xl leading-relaxed text-white/80">${escapeHtml(spec.about)}</p>
      </div>
      <div class="grid grid-cols-2 gap-4">
        ${spec.galleryImages.slice(0, 2).map((u) => `<img src="${escapeHtml(u)}" alt="" class="aspect-[4/5] w-full rounded-sm object-cover" loading="lazy" />`).join("")}
      </div>
    </div>
  </section>

  <section class="py-24 px-8">
    <div class="mx-auto max-w-4xl">
      <h2 class="font-display text-center text-3xl font-semibold">${escapeHtml(spec.sectionTitles.reviews)}</h2>
      <div class="mt-12 grid gap-6 md:grid-cols-2">${testimonialsBlock(spec)}</div>
    </div>
  </section>

  ${contactBlock(ctx, spec)}
  ${footerBlock(ctx)}
</body></html>`;
}

function renderSplit(ctx: DemoWebsiteContext, spec: DemoWebsiteSpec): string {
  const img = heroImage(ctx, spec);
  return `${pageHead(ctx, spec, `.split-hero { min-height: 100vh; }`)}
<body>
  <div class="split-hero grid lg:grid-cols-2">
    <div class="relative min-h-[45vh] lg:min-h-full">
      ${img ? `<img src="${img}" alt="" class="absolute inset-0 h-full w-full object-cover" />` : `<div class="absolute inset-0 bg-[var(--brand)]"></div>`}
    </div>
    <div class="flex flex-col justify-center px-8 py-16 lg:px-16" style="background:var(--surface)">
      <span class="inline-flex w-fit rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white" style="background:var(--accent)">${escapeHtml(spec.categoryLabel)}</span>
      <h1 class="font-display mt-8 text-5xl font-bold leading-tight lg:text-6xl">${ctx.nameEsc}</h1>
      <p class="mt-6 text-xl text-[var(--muted)]">${escapeHtml(spec.tagline)}</p>
      <div class="mt-6">${ratingBadge(ctx)}</div>
      <div class="mt-10 flex gap-4">
        <a href="${ctx.tel}" class="rounded-2xl px-8 py-4 font-semibold text-white shadow-lg" style="background:var(--brand)">${escapeHtml(spec.ctaPrimary)}</a>
        <a href="${ctx.mapsUrl}" target="_blank" rel="noopener noreferrer" class="rounded-2xl border-2 px-8 py-4 font-semibold" style="border-color:var(--brand);color:var(--brand)">Directions</a>
      </div>
    </div>
  </div>

  <section id="services" class="py-24 px-8" style="background:var(--bg)">
    <div class="mx-auto max-w-3xl">
      <h2 class="font-display text-4xl font-semibold">${escapeHtml(spec.sectionTitles.services)}</h2>
      <div class="mt-12 space-y-10">${servicesBlock(spec, "list")}</div>
    </div>
  </section>

  <section id="about" class="py-24 px-8">
    <div class="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
      <img src="${escapeHtml(spec.galleryImages[1] ?? spec.galleryImages[0] ?? img)}" alt="" class="rounded-[2rem] shadow-2xl" loading="lazy" />
      <div>
        <h2 class="font-display text-4xl font-semibold">${escapeHtml(spec.sectionTitles.about)}</h2>
        <p class="mt-6 text-lg leading-relaxed text-[var(--muted)]">${escapeHtml(spec.about)}</p>
        <p class="mt-6 font-semibold">${ctx.addressLine}</p>
        <p class="text-[var(--muted)]">${ctx.location}</p>
      </div>
    </div>
  </section>

  <section class="py-24 px-8 bg-[var(--surface)]">
    <h2 class="text-center font-display text-3xl font-semibold">${escapeHtml(spec.sectionTitles.reviews)}</h2>
    <div class="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">${testimonialsBlock(spec)}</div>
  </section>

  ${contactBlock(ctx, spec, true)}
  ${footerBlock(ctx)}
</body></html>`;
}

function renderLuxury(ctx: DemoWebsiteContext, spec: DemoWebsiteSpec): string {
  const img = heroImage(ctx, spec);
  return `${pageHead(ctx, spec, `
    .luxury-line { height: 1px; background: linear-gradient(90deg, transparent, var(--accent), transparent); }
  `)}
<body>
  <nav class="flex items-center justify-between px-8 py-8 max-w-6xl mx-auto">
    <span class="font-display text-2xl tracking-wide">${ctx.nameEsc}</span>
    <a href="${ctx.tel}" class="text-sm font-semibold uppercase tracking-[0.2em]" style="color:var(--accent)">${escapeHtml(spec.ctaPrimary)}</a>
  </nav>

  <header class="mx-auto max-w-4xl px-8 py-20 text-center">
    <p class="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">${escapeHtml(spec.categoryLabel)} · ${ctx.location}</p>
    <div class="luxury-line mx-auto my-8 w-24"></div>
    <h1 class="font-display text-5xl font-medium leading-tight sm:text-6xl">${ctx.nameEsc}</h1>
    <p class="mx-auto mt-8 max-w-2xl text-lg italic text-[var(--muted)]">${escapeHtml(spec.tagline)}</p>
    <div class="mt-8 flex justify-center">${ratingBadge(ctx)}</div>
  </header>

  ${img ? `<div class="mx-auto max-w-5xl px-8"><img src="${img}" alt="" class="aspect-[21/9] w-full rounded-sm object-cover shadow-2xl" loading="lazy" /></div>` : ""}

  <section id="services" class="mx-auto max-w-3xl px-8 py-24">
    <h2 class="text-center font-display text-3xl">${escapeHtml(spec.sectionTitles.services)}</h2>
    <div class="mt-16">${servicesBlock(spec, "minimal")}</div>
  </section>

  <section id="about" class="border-y border-black/5 py-24 px-8">
    <div class="mx-auto max-w-3xl text-center">
      <h2 class="font-display text-3xl">${escapeHtml(spec.sectionTitles.about)}</h2>
      <p class="mt-8 text-lg leading-loose text-[var(--muted)]">${escapeHtml(spec.about)}</p>
    </div>
  </section>

  <section class="py-16 px-8">
    <div class="mx-auto grid max-w-5xl grid-cols-3 gap-4">
      ${spec.galleryImages.map((u) => `<img src="${escapeHtml(u)}" alt="" class="aspect-square object-cover" loading="lazy" />`).join("")}
    </div>
  </section>

  <section class="py-24 px-8">
    <div class="mx-auto max-w-2xl space-y-8">${testimonialsBlock(spec)}</div>
  </section>

  ${contactBlock(ctx, spec)}
  ${footerBlock(ctx)}
</body></html>`;
}

function renderBento(ctx: DemoWebsiteContext, spec: DemoWebsiteSpec): string {
  const img = heroImage(ctx, spec);
  return `${pageHead(ctx, spec, `
    .bento-glow { background: radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--accent) 25%, transparent), transparent 50%); }
  `)}
<body class="bento-glow">
  <header class="mx-auto max-w-6xl px-6 py-12">
    <div class="grid gap-4 md:grid-cols-4 md:grid-rows-2">
      <div class="md:col-span-2 md:row-span-2 rounded-[2.5rem] p-10 text-white shadow-xl" style="background:linear-gradient(145deg,var(--brand-dark),var(--brand))">
        <p class="text-sm font-bold uppercase tracking-widest text-white/60">${escapeHtml(spec.categoryLabel)}</p>
        <h1 class="font-display mt-6 text-4xl font-bold leading-tight sm:text-5xl">${ctx.nameEsc}</h1>
        <p class="mt-4 text-white/80">${escapeHtml(spec.tagline)}</p>
        <a href="${ctx.tel}" class="mt-8 inline-block rounded-2xl bg-white px-6 py-3 text-sm font-bold text-slate-900">${escapeHtml(spec.ctaPrimary)}</a>
      </div>
      ${img ? `<div class="md:col-span-2 rounded-[2.5rem] overflow-hidden min-h-[200px]"><img src="${img}" alt="" class="h-full w-full object-cover" /></div>` : ""}
      <div class="rounded-[2rem] p-6" style="background:var(--surface)">
        <p class="text-3xl font-bold">${ctx.rating?.toFixed(1) ?? "5.0"}</p>
        <p class="text-sm text-[var(--muted)]">Star rating</p>
      </div>
      <div class="rounded-[2rem] p-6" style="background:var(--surface)">
        <p class="text-3xl font-bold">${ctx.reviews > 0 ? ctx.reviews.toLocaleString() : "100+"}</p>
        <p class="text-sm text-[var(--muted)]">Reviews</p>
      </div>
    </div>
  </header>

  <section id="services" class="mx-auto max-w-6xl px-6 py-16">
    <h2 class="font-display text-3xl font-bold">${escapeHtml(spec.sectionTitles.services)}</h2>
    <div class="mt-10 grid gap-4 md:grid-cols-3">${servicesBlock(spec, "bento")}</div>
  </section>

  <section id="about" class="mx-auto max-w-6xl px-6 py-16">
    <div class="rounded-[2.5rem] p-10 md:p-16" style="background:var(--surface)">
      <h2 class="font-display text-3xl font-bold">${escapeHtml(spec.sectionTitles.about)}</h2>
      <p class="mt-6 max-w-3xl text-lg text-[var(--muted)]">${escapeHtml(spec.about)}</p>
      <p class="mt-6 font-semibold">${ctx.location}</p>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-6 py-16">
    <h2 class="font-display text-3xl font-bold">${escapeHtml(spec.sectionTitles.reviews)}</h2>
    <div class="mt-8 grid gap-4 md:grid-cols-2">${testimonialsBlock(spec)}</div>
  </section>

  ${contactBlock(ctx, spec)}
  ${footerBlock(ctx)}
</body></html>`;
}

function renderDark(ctx: DemoWebsiteContext, spec: DemoWebsiteSpec): string {
  const img = heroImage(ctx, spec);
  const darkSpec = { ...spec, colors: { ...spec.colors, background: "#09090b", surface: "#18181b", text: "#fafafa", muted: "#a1a1aa" } };
  return `${pageHead(ctx, darkSpec, `
    body { background: #09090b; color: #fafafa; }
    .mesh { background: radial-gradient(at 40% 20%, color-mix(in srgb, var(--accent) 35%, transparent) 0px, transparent 50%),
                      radial-gradient(at 80% 0%, color-mix(in srgb, var(--brand) 40%, transparent) 0px, transparent 50%); }
  `)}
<body class="mesh">
  <nav class="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <span class="font-display text-xl font-semibold">${ctx.nameEsc}</span>
      <div class="flex items-center gap-6 text-sm">
        <a href="#services" class="text-white/70 hover:text-white">Services</a>
        <a href="#contact" class="rounded-full px-5 py-2 font-semibold text-zinc-950" style="background:var(--accent)">${escapeHtml(spec.ctaPrimary)}</a>
      </div>
    </div>
  </nav>

  <header class="relative overflow-hidden px-6 py-24 sm:py-32">
    <div class="mx-auto max-w-4xl text-center">
      <p class="text-sm font-bold uppercase tracking-[0.3em]" style="color:var(--accent)">${escapeHtml(spec.categoryLabel)}</p>
      <h1 class="font-display mt-6 text-5xl font-bold leading-tight sm:text-7xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">${ctx.nameEsc}</h1>
      <p class="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">${escapeHtml(spec.tagline)}</p>
      <div class="mt-8 flex justify-center">${ratingBadge(ctx, true)}</div>
    </div>
    ${img ? `<div class="mx-auto mt-16 max-w-5xl overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/50"><img src="${img}" alt="" class="aspect-[21/9] w-full object-cover opacity-90" loading="lazy" /></div>` : ""}
  </header>

  <section id="services" class="px-6 py-24">
    <div class="mx-auto max-w-6xl">
      <h2 class="font-display text-3xl font-bold">${escapeHtml(spec.sectionTitles.services)}</h2>
      <div class="mt-12 grid gap-6 md:grid-cols-3">${servicesBlock(spec, "cards")}</div>
    </div>
  </section>

  <section id="about" class="border-y border-white/10 px-6 py-24">
    <div class="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
      <p class="text-xl leading-relaxed text-zinc-300">${escapeHtml(spec.about)}</p>
      <div class="grid grid-cols-2 gap-3">
        ${spec.galleryImages.slice(0, 2).map((u) => `<img src="${escapeHtml(u)}" alt="" class="rounded-2xl object-cover aspect-square" loading="lazy" />`).join("")}
      </div>
    </div>
  </section>

  <section class="px-6 py-24">
    <div class="mx-auto max-w-4xl grid gap-6 md:grid-cols-2">${testimonialsBlock(spec, true)}</div>
  </section>

  ${contactBlock(ctx, spec, true)}
  <footer class="border-t border-white/10 py-12 text-center text-sm text-zinc-500">
    <p class="font-display text-lg text-white">${ctx.nameEsc}</p>
    <p class="mt-2">${ctx.location}</p>
    <p class="mt-6">© ${ctx.year}</p>
  </footer>
</body></html>`;
}

function renderClassic(ctx: DemoWebsiteContext, spec: DemoWebsiteSpec): string {
  const img = heroImage(ctx, spec);
  return `${pageHead(ctx, spec)}
<body>
  <nav class="border-b border-black/5 bg-[var(--surface)]">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <span class="font-display text-xl font-bold">${ctx.nameEsc}</span>
      <div class="hidden gap-8 text-sm font-medium md:flex">
        <a href="#services">Services</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </div>
      <a href="${ctx.tel}" class="rounded-lg px-4 py-2 text-sm font-semibold text-white" style="background:var(--brand)">${escapeHtml(spec.ctaPrimary)}</a>
    </div>
  </nav>

  <header class="relative flex min-h-[75vh] items-center justify-center px-6 text-center text-white">
    ${img ? `<img src="${img}" alt="" class="absolute inset-0 h-full w-full object-cover" />` : `<div class="absolute inset-0 bg-[var(--brand)]"></div>`}
    <div class="absolute inset-0 bg-black/55"></div>
    <div class="relative z-10 max-w-3xl">
      <p class="text-sm font-bold uppercase tracking-widest text-white/70">${escapeHtml(spec.categoryLabel)}</p>
      <h1 class="font-display mt-4 text-5xl font-bold sm:text-6xl">${ctx.nameEsc}</h1>
      <p class="mt-6 text-xl text-white/90">${escapeHtml(spec.tagline)}</p>
      <div class="mt-8 flex justify-center">${ratingBadge(ctx, true)}</div>
      <div class="mt-10 flex flex-wrap justify-center gap-4">
        <a href="${ctx.tel}" class="rounded-xl px-8 py-4 font-bold text-slate-900 bg-white">${escapeHtml(spec.ctaPrimary)}</a>
        <a href="#services" class="rounded-xl border border-white/40 px-8 py-4 font-semibold">${escapeHtml(spec.ctaSecondary)}</a>
      </div>
    </div>
  </header>

  <section class="grid grid-cols-2 divide-x divide-black/5 border-b border-black/5 bg-[var(--surface)] md:grid-cols-4">
    ${[
      [ctx.rating?.toFixed(1) ?? "5.0", "Rating"],
      [ctx.reviews > 0 ? ctx.reviews.toLocaleString() : "100+", "Reviews"],
      [ctx.location !== "—" ? ctx.location.split(",")[0] : "Local", "Area"],
      ["Same-week", "Booking"],
    ]
      .map(
        ([v, l]) =>
          `<div class="px-6 py-8 text-center"><p class="text-2xl font-bold">${v}</p><p class="mt-1 text-xs uppercase tracking-wider text-[var(--muted)]">${l}</p></div>`
      )
      .join("")}
  </section>

  <section id="services" class="py-24 px-6 even:bg-[var(--surface)]">
    <div class="mx-auto max-w-6xl text-center">
      <h2 class="font-display text-4xl font-bold">${escapeHtml(spec.sectionTitles.services)}</h2>
      <div class="mt-16 grid gap-8 md:grid-cols-3">${servicesBlock(spec, "cards")}</div>
    </div>
  </section>

  <section id="about" class="py-24 px-6">
    <div class="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
      <div class="order-2 lg:order-1">
        <h2 class="font-display text-4xl font-bold">${escapeHtml(spec.sectionTitles.about)}</h2>
        <p class="mt-6 text-lg leading-relaxed text-[var(--muted)]">${escapeHtml(spec.about)}</p>
        <ul class="mt-8 space-y-2 text-[var(--muted)]">
          <li>${ctx.addressLine}</li>
          ${ctx.phone ? `<li>${ctx.phoneDisplay}</li>` : ""}
        </ul>
      </div>
      <img src="${escapeHtml(spec.galleryImages[0] ?? img)}" alt="" class="order-1 rounded-3xl shadow-xl lg:order-2" loading="lazy" />
    </div>
  </section>

  <section class="py-24 px-6 bg-[var(--surface)]">
    <h2 class="text-center font-display text-3xl font-bold">${escapeHtml(spec.sectionTitles.reviews)}</h2>
    <div class="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">${testimonialsBlock(spec)}</div>
  </section>

  ${contactBlock(ctx, spec)}
  ${footerBlock(ctx)}
</body></html>`;
}

export function renderDemoWebsite(
  ctx: DemoWebsiteContext,
  spec: DemoWebsiteSpec
): string {
  switch (spec.layout) {
    case "split":
      return renderSplit(ctx, spec);
    case "luxury":
      return renderLuxury(ctx, spec);
    case "bento":
      return renderBento(ctx, spec);
    case "dark":
      return renderDark(ctx, spec);
    case "classic":
      return renderClassic(ctx, spec);
    case "editorial":
    default:
      return renderEditorial(ctx, spec);
  }
}
