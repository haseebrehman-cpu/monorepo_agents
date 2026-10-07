import {
  DataGrid,
  type GridColDef,
  type GridValidRowModel,
} from "@rdx/ui";

interface DataTableProps<TData extends GridValidRowModel & { id: string }> {
  columns: GridColDef<TData>[];
  data: TData[];
  label: string;
}

export function DataTable<TData extends GridValidRowModel & { id: string }>({
  columns,
  data,
  label,
}: DataTableProps<TData>) {
  return (
    <DataGrid
      rows={data}
      columns={columns}
      label={label}
      getRowId={(row) => row.id}
      checkboxSelection={false}
      cellSelection={false}
      cellSelectionFillHandle={false}
      slotProps={{ toolbar: { showQuickFilter: false } }}
      virtualizeColumnsWithAutoRowHeight={true}
      height="calc(100vh - 200px)"
      sx={{ padding: "10px" }}
    />
  );
}
