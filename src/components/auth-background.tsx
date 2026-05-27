import type { CSSProperties } from "react";

const stars = Array.from({ length: 72 }, (_, index) => ({
  x: (index * 37) % 100,
  y: (index * 61) % 100,
  size: 1 + (index % 3) * 0.65,
  delay: `${(index % 12) * 0.32}s`,
  duration: `${2.4 + (index % 7) * 0.38}s`,
}));

const shootingStars = Array.from({ length: 11 }, (_, index) => ({
  top: `${-12 + index * 8}%`,
  left: `${-24 - (index % 4) * 18}%`,
  delay: `${index * -0.85}s`,
  duration: `${3.8 + (index % 4) * 0.7}s`,
  travelX: `${132 + (index % 3) * 18}vw`,
  travelY: `${58 + (index % 5) * 8}vh`,
}));

export function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgba(16,185,129,0.15),transparent_28rem),radial-gradient(circle_at_80%_35%,rgba(0,212,255,0.1),transparent_24rem),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.08),transparent_22rem)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.045)_1px,transparent_1px)] bg-[size:42px_42px] dark:block hidden" />
      <div className="auth-stars absolute inset-0">
        {stars.map((star, index) => (
          <span
            key={index}
            className="auth-star"
            style={
              {
                "--star-x": `${star.x}%`,
                "--star-y": `${star.y}%`,
                "--star-size": `${star.size}px`,
                "--star-delay": star.delay,
                "--star-duration": star.duration,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="absolute inset-0">
        {shootingStars.map((star, index) => (
          <span
            key={index}
            className="auth-shooting-star"
            style={
              {
                "--shooting-top": star.top,
                "--shooting-left": star.left,
                "--shooting-delay": star.delay,
                "--shooting-duration": star.duration,
                "--shooting-travel-x": star.travelX,
                "--shooting-travel-y": star.travelY,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(5,8,6,0.2)_45%,rgba(5,8,6,0.84)_100%)]" />
    </div>
  );
}
