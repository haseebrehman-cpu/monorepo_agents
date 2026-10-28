import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "lucide-react";
import ResendFilterPane from "../../../components/atoms/ResendFilterPane";
import { Button, PlusIcon } from "@rdx/ui";
import { hasPermission, P } from "../../../lib/permissions";
import { EMPTY_RESEND_FILTERS, type ResendSortField } from "../../../lib/resends-api";
import { useMe } from "../../../lib/use-me";
import { useResends } from "../../../lib/use-resends";
import { resendColumns } from "./tickets-table/columns";
import { DataTable } from "./tickets-table/data-table";

const Resend = () => {
  const navigate = useNavigate();
  const me = useMe();
  const canCreate = hasPermission(me.data?.user, P.RESEND_CREATE);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_RESEND_FILTERS);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [sort, setSort] = useState<{
    sortBy: ResendSortField;
    sortDirection: "asc" | "desc";
  }>({
    sortBy: "createdAt",
    sortDirection: "desc",
  });
  const resendsQuery = useResends(appliedFilters, { ...paginationModel, ...sort });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Resend List</h1>
        <div className="flex flex-row gap-2">
          {canCreate ? (
            <Button size="sm" variant="outline" onClick={() => navigate("/resend/add")}>
              <PlusIcon className="h-4 w-4" />
              Add Resend
            </Button>
          ) : null}
        </div>
      </div>
      <ResendFilterPane
        onApply={(filters) => {
          setAppliedFilters(filters);
          setPaginationModel((current) => ({ ...current, page: 0 }));
        }}
        onReset={() => {
          setAppliedFilters(EMPTY_RESEND_FILTERS);
          setPaginationModel((current) => ({ ...current, page: 0 }));
        }}
      />
      {resendsQuery.isLoading ? (
        <div className="flex flex-row items-center gap-2">
          <Loader className="h-4 w-4 animate-spin" />
          <p className="text-sm text-slate-500">Loading resends...</p>
        </div>
      ) : resendsQuery.isError ? (
        <p className="text-sm text-red-600">Could not load resends.</p>
      ) : (
        <DataTable
          columns={resendColumns}
          data={resendsQuery.data?.items ?? []}
          label="Resends"
          loading={resendsQuery.isFetching}
          rowCount={resendsQuery.data?.total ?? 0}
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
              sortBy: (next?.field as ResendSortField | undefined) ?? "createdAt",
              sortDirection: next?.sort === "asc" ? "asc" : "desc",
            });
            setPaginationModel((current) => ({ ...current, page: 0 }));
          }}
        />
      )}
    </div>
  );
};

export default Resend;
