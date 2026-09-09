import { DropDown } from "@rdx/ui";

type FiltersProps = {
  value: string;
  onChange: (value: string | null) => void;
  options: string[];
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
      onChange={onChange}
      label={placeholder}
      className="w-full"
    />
  );
};

export default Filters;
