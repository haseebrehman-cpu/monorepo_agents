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
