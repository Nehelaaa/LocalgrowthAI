import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 55%, #0ea5e9 100%)",
          color: "white",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
        }}
      >
        <div style={{ width: 980, display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "rgba(255,255,255,0.16)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              L
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>LocalLeadster</div>
          </div>
          <div style={{ fontSize: 62, fontWeight: 900, lineHeight: 1.04, letterSpacing: -1 }}>
            Local lead generation + pipeline.
          </div>
          <div style={{ fontSize: 26, opacity: 0.92, lineHeight: 1.35 }}>
            Find prospects with Google Places, qualify fast, and close more local deals.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
            {["Search", "Score", "CRM", "Exports (Pro)"].map((t) => (
              <div
                key={t}
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.16)",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}

