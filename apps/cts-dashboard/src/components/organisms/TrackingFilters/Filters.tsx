import { DropDown, type DropDownOption } from "@rdx/ui";

type FiltersProps = {
  value: string;
  onChange: (value: string) => void;
  options: Array<string | DropDownOption>;
  id?: string;
  placeholder?: string;
};

const Filters = ({
  value,
  onChange,
  options,
  id,
  placeholder = "Select an option",
}: FiltersProps) => {
  return (
    <DropDown
      id={id}
      options={options}
      value={value || null}
      onChange={(next) => onChange(next ?? "")}
      label={placeholder}
      className="w-full"
    />
  );
};

export default Filters;
