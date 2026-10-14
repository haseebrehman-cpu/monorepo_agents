import { useState, type FormEvent } from "react";
import { isValidHandoffContact } from "@/lib/human-agent";

interface HandoffFormProps {
  disabled: boolean;
  onSubmit: (name: string, email: string) => void;
}

const inputClass =
  "h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-rdx-red focus:ring-1 focus:ring-rdx-red focus:outline-none disabled:opacity-60";

export default function HandoffForm({ disabled, onSubmit }: HandoffFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;
    if (!isValidHandoffContact(name, email)) {
      setError("Enter your name and a valid email.");
      return;
    }
    setError(null);
    onSubmit(name.trim(), email.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left"
    >
      <p className="text-[12px] font-medium text-slate-800">
        Talk to a person
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
        Add your name and email and we will connect you with an agent.
      </p>
      <label className="mt-2 block">
        <span className="mb-1 block text-[11px] font-medium text-slate-600">
          Name
        </span>
        <input
          type="text"
          name="name"
          autoComplete="name"
          required
          maxLength={80}
          value={name}
          disabled={disabled}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="mt-2 block">
        <span className="mb-1 block text-[11px] font-medium text-slate-600">
          Email
        </span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          maxLength={120}
          value={email}
          disabled={disabled}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </label>
      {error && (
        <p className="mt-2 text-[12px] text-red-700" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={disabled}
        className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-lg bg-rdx-red px-3 text-[12px] font-semibold text-white shadow-sm transition hover:bg-rdx-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rdx-red/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Submit
      </button>
    </form>
  );
}
