import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "lucide-react";
import RefundFilterPane from "../../../components/atoms/RefuncFilterPane";
import { Button, PlusIcon } from "@rdx/ui";
import { hasPermission, P } from "../../../lib/permissions";
import { EMPTY_REFUND_FILTERS, type RefundSortField } from "../../../lib/refunds-api";
import { useMe } from "../../../lib/use-me";
import { useRefunds } from "../../../lib/use-refunds";
import { refundColumns } from "./tickets-table/columns";
import { DataTable } from "./tickets-table/data-table";

const RefundPage = () => {
  const navigate = useNavigate();
  const me = useMe();
  const canCreate = hasPermission(me.data?.user, P.REFUND_CREATE);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_REFUND_FILTERS);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [sort, setSort] = useState<{
    sortBy: RefundSortField;
    sortDirection: "asc" | "desc";
  }>({
    sortBy: "createdAt",
    sortDirection: "desc",
  });
  const refundsQuery = useRefunds(appliedFilters, { ...paginationModel, ...sort });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Refund List</h1>
        <div className="flex flex-row gap-2">
          {canCreate ? (
            <Button size="sm" variant="outline" onClick={() => navigate("/refund/add")}>
              <PlusIcon className="h-4 w-4" />
              Add Refund
            </Button>
          ) : null}
        </div>
      </div>
      <RefundFilterPane
        onApply={(filters) => {
          setAppliedFilters(filters);
          setPaginationModel((current) => ({ ...current, page: 0 }));
        }}
        onReset={() => {
          setAppliedFilters(EMPTY_REFUND_FILTERS);
          setPaginationModel((current) => ({ ...current, page: 0 }));
        }}
      />
      {refundsQuery.isLoading ? (
        <div className="flex flex-row items-center gap-2">
          <Loader className="h-4 w-4 animate-spin" />
          <p className="text-sm text-slate-500">Loading refunds...</p>
        </div>
      ) : refundsQuery.isError ? (
        <p className="text-sm text-red-600">Could not load refunds.</p>
      ) : (
        <DataTable
          columns={refundColumns}
          data={refundsQuery.data?.items ?? []}
          label="Refunds"
          loading={refundsQuery.isFetching}
          rowCount={refundsQuery.data?.total ?? 0}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={
            sort.sortBy === "createdAt"
              ? []
              : [{ field: sort.sortBy, sort: sort.sortDirection }]
          }
          onSortModelChange={(model) => {
            const next = model[0];
            setSort({
              sortBy: (next?.field as RefundSortField | undefined) ?? "createdAt",
              sortDirection: next?.sort === "asc" ? "asc" : "desc",
            });
            setPaginationModel((current) => ({ ...current, page: 0 }));
          }}
        />
      )}
    </div>
  );
};

export default RefundPage;
