import { PlusIcon } from "lucide-react"
import RefundFilterPane from "../../../components/atoms/RefuncFilterPane"
import { Button } from "@rdx/ui"
import { refundColumns } from "./tickets-table/columns"
import { DataTable } from "./tickets-table/data-table"

const RefundPage = () => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Refund List</h1>
        <div className="flex flex-row gap-2">
          <Button size="sm" variant="outline" onClick={() => { }}>
            <PlusIcon className="h-4 w-4" />
            Add Refund
          </Button>
        </div>
      </div>
      <RefundFilterPane />
      <DataTable columns={refundColumns} data={[]} label="Refunds" />
    </div>
  )
}

export default RefundPage
