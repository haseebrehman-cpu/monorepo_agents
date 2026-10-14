import {
  DataGrid,
  type DataGridProps,
  type GridColDef,
  type GridValidRowModel,
} from "@rdx/ui";

interface DataTableProps<TData extends GridValidRowModel & { id: string }> {
  columns: GridColDef<TData>[];
  data: TData[];
  label: string;
  loading?: boolean;
  rowCount?: number;
  paginationModel?: DataGridProps<TData>["paginationModel"];
  onPaginationModelChange?: DataGridProps<TData>["onPaginationModelChange"];
  sortModel?: DataGridProps<TData>["sortModel"];
  onSortModelChange?: DataGridProps<TData>["onSortModelChange"];
}

export function DataTable<TData extends GridValidRowModel & { id: string }>({
  columns,
  data,
  label,
  loading = false,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
}: DataTableProps<TData>) {
  const serverPagination = paginationModel !== undefined && rowCount !== undefined;

  return (
    <DataGrid
      rows={data}
      columns={columns}
      label={label}
      loading={loading}
      getRowId={(row) => row.id}
      checkboxSelection={false}
      cellSelection={false}
      cellSelectionFillHandle={false}
      slotProps={{ toolbar: { showQuickFilter: false } }}
      virtualizeColumnsWithAutoRowHeight={true}
      height="calc(100vh - 200px)"
      sx={{ padding: "10px" }}
      {...(serverPagination
        ? {
            rowCount,
            paginationMode: "server" as const,
            paginationModel,
            onPaginationModelChange,
            sortingMode: "server" as const,
            sortModel,
            onSortModelChange,
          }
        : {})}
    />
  );
}
