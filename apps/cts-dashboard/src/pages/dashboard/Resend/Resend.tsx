import { useNavigate } from "react-router-dom";
import ResendFilterPane from "../../../components/atoms/ResendFilterPane";
import { Button, PlusIcon } from "@rdx/ui";
import { resendColumns } from "./tickets-table/columns";
import { DataTable } from "./tickets-table/data-table";

const Resend = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Resend List</h1>
        <div className="flex flex-row gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate("/resend/add")}>
            <PlusIcon className="h-4 w-4" />
            Add Resend
          </Button>
        </div>
      </div>
      <ResendFilterPane />
      <DataTable columns={resendColumns} data={[]} label="Resends" />
    </div>
  );
};

export default Resend;
