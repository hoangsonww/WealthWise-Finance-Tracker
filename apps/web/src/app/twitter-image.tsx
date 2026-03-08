import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 600,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #111827 0%, #0f172a 45%, #1e293b 100%)",
          color: "#f8fafc",
          fontFamily: "Arial, sans-serif",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "64px",
          gap: "48px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: "760px" }}>
          <div style={{ fontSize: 30, fontWeight: 600, color: "#93c5fd" }}>WealthWise</div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 62,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
            }}
          >
            <span>Personal Finance,</span>
            <span>Finally Organized</span>
          </div>
          <div style={{ fontSize: 26, color: "#cbd5e1" }}>
            Expenses, budgets, goals, recurring bills, and analytics in one dashboard.
          </div>
        </div>

        <div
          style={{
            width: "220px",
            height: "220px",
            borderRadius: "28px",
            border: "1px solid rgba(148,163,184,0.35)",
            background: "rgba(15,23,42,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "72px",
            fontWeight: 700,
            color: "#38bdf8",
          }}
        >
          WW
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
