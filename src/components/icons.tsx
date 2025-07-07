import type { SVGProps } from "react";

export function ChibiIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      data-ai-hint="chibi mascot"
    >
      <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10A10 10 0 0 0 12 2z" fill="hsl(var(--primary) / 0.2)" stroke="none" />
      {/* Serene, closed eyes */}
      <path d="M9 13 C 9.5 12, 10.5 12, 11 13" />
      <path d="M15 13 C 14.5 12, 13.5 12, 13 13" />
      {/* Gentle smile */}
      <path d="M9.5 16 A 2.5 2.5 0 0 1 14.5 16" />
    </svg>
  );
}
