import { useState, type FormEvent } from "react";
import type { SupportInputField, SupportInputOption, SupportInputRequest } from "@rdx/chat-contract";
import { cn } from "@rdx/ui/lib/utils";
import { cardClass, primaryButtonClass, secondaryButtonClass } from "./form-styles";
import TextField from "./TextField";

const DEFAULT_VERIFY_FIELDS: SupportInputField[] = [
  { name: "order_number", label: "Order number", required: true },
  { name: "email", label: "Email or postcode", required: true },
];

const DEFAULT_CONFIRM_OPTIONS: SupportInputOption[] = ["yes", "no"];

function optionValue(option: SupportInputOption): string {
  return typeof option === "string" ? option : option.value;
}

function optionLabel(option: SupportInputOption): string {
  const label = typeof option === "string" ? option : (option.label ?? option.value);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function fieldLabel(field: SupportInputField): string {
  return field.label || field.name.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

interface InputRequestFormProps {
  input: SupportInputRequest;
  /** Contact form for `intent.label === "human_handoff"`. */
  handoff?: boolean;
  disabled: boolean;
  onAnswer: (text: string) => void;
}

function fieldValuesMessage(fields: SupportInputField[], values: Record<string, string>, labeled: boolean): string {
  return fields
    .map((field) => {
      const value = values[field.name]?.trim();
      if (!value) return null;
      return labeled ? `${fieldLabel(field)}: ${value}` : value;
    })
    .filter((line): line is string => Boolean(line))
    .join(labeled ? "\n" : " ");
}

function FieldForm({
  fields,
  disabled,
  submitLabel,
  labeled,
  onAnswer,
}: {
  fields: SupportInputField[];
  disabled: boolean;
  submitLabel: string;
  labeled: boolean;
  onAnswer: (text: string) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const missing = fields.some((field) => field.required && !values[field.name]?.trim());
    if (missing) return;
    const answer = fieldValuesMessage(fields, values, labeled);
    if (answer) onAnswer(answer);
  };

  return (
    <form onSubmit={handleSubmit} className={cn(cardClass, "space-y-2")}>
      {fields.map((field) => (
        <TextField
          key={field.name}
          label={fieldLabel(field)}
          type={field.type === "email" ? "email" : "text"}
          required={field.required ?? false}
          placeholder={field.placeholder ?? undefined}
          autoComplete={field.type === "email" ? "email" : field.name === "name" ? "name" : undefined}
          value={values[field.name] ?? ""}
          disabled={disabled}
          maxLength={field.name === "address" ? 240 : 120}
          onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
        />
      ))}
      <button type="submit" disabled={disabled} className={cn(primaryButtonClass, "mt-1")}>
        {submitLabel}
      </button>
    </form>
  );
}

/** Renders what a paused conversation is waiting for. The customer can also just type. */
export default function InputRequestForm({ input, handoff = false, disabled, onAnswer }: InputRequestFormProps) {
  if (handoff || input.kind === "handoff_contact") {
    const fields = input.fields ?? [];
    if (fields.length === 0) return null;
    return (
      <FieldForm
        fields={fields}
        disabled={disabled}
        submitLabel="Connect"
        labeled
        onAnswer={onAnswer}
      />
    );
  }

  if (input.kind === "verify_order") {
    const fields = input.fields?.length ? input.fields : DEFAULT_VERIFY_FIELDS;
    return <FieldForm fields={fields} disabled={disabled} submitLabel="Send details" labeled={false} onAnswer={onAnswer} />;
  }

  if (input.kind === "confirm_action") {
    const options = input.options?.length ? input.options : DEFAULT_CONFIRM_OPTIONS;
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map((option, index) => (
          <button
            key={optionValue(option)}
            type="button"
            disabled={disabled}
            onClick={() => onAnswer(optionValue(option))}
            className={index === 0 ? primaryButtonClass : secondaryButtonClass}
          >
            {optionLabel(option)}
          </button>
        ))}
      </div>
    );
  }

  return null;
}
