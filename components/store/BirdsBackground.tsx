"use client";

const birds = [
  { top: "12%", duration: "22s", delay: "0s", size: 28, opacity: 0.5, flapDuration: "0.6s" },
  { top: "22%", duration: "28s", delay: "4s", size: 20, opacity: 0.35, flapDuration: "0.5s" },
  { top: "8%", duration: "25s", delay: "9s", size: 24, opacity: 0.4, flapDuration: "0.7s" },
];

function BirdSVG({ size, flapDuration }: { size: number; flapDuration: string }) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 48 24" fill="none">
      <path
        d="M2 14 C 10 4, 16 4, 24 14 C 32 4, 38 4, 46 14"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        style={{
          animation: `flap ${flapDuration} ease-in-out infinite`,
          transformOrigin: "center",
        }}
      />
    </svg>
  );
}

export default function BirdsBackground() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <style>{`
        @keyframes flyAcross {
          0% { transform: translateX(-80px); }
          100% { transform: translateX(calc(100vw + 80px)); }
        }
        @keyframes flap {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.35); }
        }
      `}</style>
      {birds.map((bird, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: bird.top,
            left: 0,
            opacity: bird.opacity,
            animation: `flyAcross ${bird.duration} linear ${bird.delay} infinite`,
          }}
        >
          <BirdSVG size={bird.size} flapDuration={bird.flapDuration} />
        </div>
      ))}
    </div>
  );
}
