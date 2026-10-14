import CategoryTicketFilterPane from "../CategoryTicketFilterPane";
import type { RefundListFilters } from "../../../lib/refunds-api";

type RefundFilterPaneProps = {
  onApply?: (filters: RefundListFilters) => void;
  onReset?: () => void;
};

const RefundFilterPane = ({ onApply, onReset }: RefundFilterPaneProps) => {
  return <CategoryTicketFilterPane kind="refund" onApply={onApply} onReset={onReset} />;
};

export default RefundFilterPane;
