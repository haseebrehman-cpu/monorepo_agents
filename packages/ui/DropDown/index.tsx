import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/select";

export type DropDownOption = {
  label: string;
  value: string;
};

export type DropDownProps = {
  options: Array<string | DropDownOption>;
  value?: string | null;
  onChange?: (value: string | null) => void;
  label?: string;
  className?: string;
  id?: string;
};

export default function DropDown({
  options,
  value,
  onChange,
  label,
  className,
  id,
}: DropDownProps) {
  const items = options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option,
  );

  return (
    <Select items={items} value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={className ?? "w-full max-w-48"}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
