import GoBack from "../../molecules/GoBack";
import CategoryTicketForm, { type CategoryTicketKind } from "./index";

const PAGE_COPY: Record<
  CategoryTicketKind,
  { title: string; subtitle: string }
> = {
  refund: {
    title: "Add Refund",
    subtitle: "Create a refund ticket. Category is set to Refund.",
  },
  resend: {
    title: "Add Resend",
    subtitle: "Create a resend ticket. Category is set to Resend.",
  },
  return: {
    title: "Add Return",
    subtitle: "Create a return ticket. Category is set to Return.",
  },
};

const AddCategoryTicketPage = ({ kind }: { kind: CategoryTicketKind }) => {
  const copy = PAGE_COPY[kind];

  return (
    <div className="flex flex-col gap-3">
      <div className="mb-2">
        <div className="flex items-center gap-3">
          <GoBack />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">{copy.title}</h1>
            <p className="text-xs text-slate-500">{copy.subtitle}</p>
          </div>
        </div>
      </div>
      <CategoryTicketForm kind={kind} />
    </div>
  );
};

export default AddCategoryTicketPage;
