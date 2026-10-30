import type { ComponentProps } from "react";
import { Input } from "@rdx/ui/components/input";
import { cn } from "@rdx/ui/lib/utils";
import { inputClass, labelClass } from "./form-styles";

interface TextFieldProps extends ComponentProps<"input"> {
  label: string;
}

export default function TextField({ label, className, ...props }: TextFieldProps) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <Input className={cn(inputClass, className)} {...props} />
    </label>
  );
}
