import { ImageResponse } from "next/og";

export const alt = "Motivo — Mjete në shitje në Shqipëri";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#ffffff",
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 72,
              fontWeight: 900,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: "-0.03em" }}>
            Motivo
          </div>
        </div>
        <div
          style={{
            marginTop: 56,
            fontSize: 64,
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            maxWidth: 980,
          }}
        >
          Makina, motoçikleta, furgona, varka &amp; kamionë në shitje në Shqipëri
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            color: "#cbd5e1",
            maxWidth: 980,
          }}
        >
          Shfleto listime të reja, krahaso çmime dhe kontakto shitësit direkt.
        </div>
      </div>
    ),
    { ...size },
  );
}
