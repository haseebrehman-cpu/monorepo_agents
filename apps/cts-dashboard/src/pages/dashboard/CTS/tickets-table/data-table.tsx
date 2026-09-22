import {
  DataGrid,
  type DataGridProps,
  type GridColDef,
  type GridValidRowModel,
} from "@rdx/ui";

interface DataTableProps<TData extends GridValidRowModel & { id: string }> {
  columns: GridColDef<TData>[];
  data: TData[];
  loading: boolean;
  rowCount: number;
  paginationModel: NonNullable<DataGridProps<TData>["paginationModel"]>;
  onPaginationModelChange: NonNullable<
    DataGridProps<TData>["onPaginationModelChange"]
  >;
  sortModel: NonNullable<DataGridProps<TData>["sortModel"]>;
  onSortModelChange: NonNullable<DataGridProps<TData>["onSortModelChange"]>;
  isCellEditable?: DataGridProps<TData>["isCellEditable"];
  processRowUpdate?: (newRow: TData, oldRow: TData) => Promise<TData> | TData;
}

export function DataTable<TData extends GridValidRowModel & { id: string }>({
  columns,
  data,
  loading,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  isCellEditable,
  processRowUpdate,
}: DataTableProps<TData>) {
  return (
    <DataGrid
      rows={data}
      columns={columns}
      label="Tickets"
      loading={loading}
      rowCount={rowCount}
      paginationMode="server"
      paginationModel={paginationModel}
      onPaginationModelChange={onPaginationModelChange}
      sortingMode="server"
      sortModel={sortModel}
      onSortModelChange={onSortModelChange}
      virtualizeColumnsWithAutoRowHeight={true}
      height="calc(100vh - 200px)"
      getRowId={(row) => row.id}
      checkboxSelection={false}
      cellSelection={false}
      cellSelectionFillHandle={false}
      slotProps={{ toolbar: { showQuickFilter: false } }}
      isCellEditable={isCellEditable}
      processRowUpdate={async (updatedRow, originalRow) => {
        return processRowUpdate
          ? await processRowUpdate(updatedRow, originalRow)
          : updatedRow;
      }}
      onProcessRowUpdateError={() => undefined}
      sx={{ padding: "10px" }}
    />
  );
}
