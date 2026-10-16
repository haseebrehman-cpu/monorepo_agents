import type { MenuOption } from "./constants";
import MenuGrid from "./MenuGrid";

interface OptionButtonsProps {
  disabled: boolean;
  onSelect: (option: MenuOption) => void;
}

export default function OptionButtons({
  disabled,
  onSelect,
}: OptionButtonsProps) {
  return (
    <div className="mt-3">
      <MenuGrid disabled={disabled} onSelect={onSelect} />
    </div>
  );
}
