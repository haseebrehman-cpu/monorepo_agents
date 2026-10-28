import CategoryTicketFilterPane from "../CategoryTicketFilterPane";
import type { ResendListFilters } from "../../../lib/resends-api";

type ResendFilterPaneProps = {
  onApply?: (filters: ResendListFilters) => void;
  onReset?: () => void;
};

const ResendFilterPane = ({ onApply, onReset }: ResendFilterPaneProps) => {
  return <CategoryTicketFilterPane kind="resend" onApply={onApply} onReset={onReset} />;
};

export default ResendFilterPane;
