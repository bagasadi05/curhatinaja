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
      <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10A10 10 0 0 0 12 2z" fill="hsl(var(--accent))" stroke="none" />
      <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10A10 10 0 0 0 12 2z" fill="white" stroke="none" transform="scale(0.95)" transformOrigin="center" />
      <circle cx="9.5" cy="11.5" r="1" fill="currentColor" />
      <circle cx="14.5" cy="11.5" r="1" fill="currentColor" />
      <path d="M9.5 15.5 A 2.5 2.5 0 0 0 14.5 15.5" fill="none" />
    </svg>
  );
}
