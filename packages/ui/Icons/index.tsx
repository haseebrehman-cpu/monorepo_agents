import React from "react";

export function CloseIcon({
  className = "h-6 w-6",
}: {
  className?: string;
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ChatBubbleIcon({
  className = "h-6 w-6",
}: {
  className?: string;
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10.5h8m-8 3.5h5m-9.5 6.5V6.8c0-1 .8-1.8 1.8-1.8h13.4c1 0 1.8.8 1.8 1.8v9.4c0 1-.8 1.8-1.8 1.8H7.5l-4 2.5z"
      />
    </svg>
  );
}

export function PlusIcon({
  className = "h-6 w-6",
}: {
  className?: string;
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

export function CrossCircleIcon({
  className = "h-6 w-6",
}: {
  className?: string;
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export function FullScreenIcon({
  className = "h-6 w-6",
}: {
  className?: string;
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 3H3v5" />
      <path d="M16 3h5v5" />
      <path d="M8 21H3v-5" />
      <path d="M16 21h5v-5" />
    </svg>
  );
}

export function SendIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h13m0 0l-5-5m5 5l-5 5"
      />
    </svg>
  );
}

export function HomeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"
      />
    </svg>
  );
}

export function InboxIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 13h4l2 3h4l2-3h4v6H4zM4 13l2.2-8.2A1 1 0 0 1 7.16 4h9.68a1 1 0 0 1 .96.8L20 13"
      />
    </svg>
  );
}

export function BookIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"
      />
      <path strokeLinecap="round" d="M8 7h8M8 11h8" />
    </svg>
  );
}

export function CogIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 13a7.7 7.7 0 0 0 .1-2l1.7-1.3-1.5-2.6-2 .4a7.6 7.6 0 0 0-1.7-1L15.6 3h-3.2L12 5.5a7.6 7.6 0 0 0-1.7 1l-2-.4L6.8 8.7 8.5 10a7.7 7.7 0 0 0 0 2l-1.7 1.3 1.5 2.6 2-.4a7.6 7.6 0 0 0 1.7 1l.4 2.5h3.2l.4-2.5a7.6 7.6 0 0 0 1.7-1l2 .4 1.5-2.6z"
      />
    </svg>
  );
}

export function MenuIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function ChevronLeftIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ChevronRightIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}


export function IntegrationIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
      />
    </svg>
  );
}

export function ChannelIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 9.5h5m-5 3h3"
      />
    </svg>
  );
}

export function ChartIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M4 19V5" />
      <path strokeLinecap="round" d="M4 19h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16v-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 16v-7" />
    </svg>
  );
}

export function DashboardIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M3 12h18" />
      <path strokeLinecap="round" d="M3 6h18" />
      <path strokeLinecap="round" d="M3 18h18" />
    </svg>
  );
}

export function TeamIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 19v-1.2A2.8 2.8 0 0 0 13.2 15H6.8A2.8 2.8 0 0 0 4 17.8V19"
      />
      <circle cx="10" cy="8" r="3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 19v-.9a2.4 2.4 0 0 0-1.8-2.3"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 5.2a2.7 2.7 0 0 1 0 5.1"
      />
    </svg>
  );
}

export function CreditCardIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path strokeLinecap="round" d="M2.5 10h19" />
      <path strokeLinecap="round" d="M7 15h3" />
    </svg>
  );
}

export function SettingsIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M4 7h10" />
      <path strokeLinecap="round" d="M18 7h2" />
      <circle cx="16" cy="7" r="2" />
      <path strokeLinecap="round" d="M4 17h2" />
      <path strokeLinecap="round" d="M10 17h10" />
      <circle cx="8" cy="17" r="2" />
      <path strokeLinecap="round" d="M4 12h6" />
      <path strokeLinecap="round" d="M14 12h6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}