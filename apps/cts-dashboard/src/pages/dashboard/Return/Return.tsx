import { useNavigate } from "react-router-dom";
import ReturnFilterPane from "../../../components/atoms/ReturnFilterPane";
import { Button, PlusIcon } from "@rdx/ui";
import { returnColumns } from "./tickets-table/columns";
import { DataTable } from "../Refund/tickets-table/data-table";

const Return = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Return List</h1>
        <div className="flex flex-row gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate("/return/add")}>
            <PlusIcon className="h-4 w-4" />
            Add Return
          </Button>
        </div>
      </div>
      <ReturnFilterPane />
      <DataTable columns={returnColumns} data={[]} label="Returns" />
    </div>
  );
};

export default Return;
