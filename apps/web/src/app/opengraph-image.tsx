import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 35%, #111827 100%)",
        color: "#f8fafc",
        fontFamily: "Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.35), transparent 45%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.3), transparent 40%)",
        }}
      />

      <div
        style={{
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          gap: "26px",
          width: "100%",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 600, color: "#93c5fd" }}>WealthWise</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          <span>Smart Personal</span>
          <span>Finance Tracker</span>
        </div>
        <div style={{ fontSize: 30, color: "#cbd5e1", maxWidth: "930px" }}>
          Track expenses, build budgets, and hit savings goals with analytics-driven insights.
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
