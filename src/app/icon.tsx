import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "radial-gradient(circle at 20% 20%, rgba(34,211,238,0.28), transparent 40%), linear-gradient(180deg, #050816 0%, #0b1223 100%)",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            border: "1px solid rgba(103, 232, 249, 0.28)",
            borderRadius: 18,
            boxShadow: "0 0 24px rgba(34,211,238,0.18)",
            display: "flex",
            fontSize: 30,
            fontWeight: 700,
            height: 42,
            justifyContent: "center",
            letterSpacing: "-0.08em",
            width: 42,
          }}
        >
          S
        </div>
      </div>
    ),
    size,
  );
}
