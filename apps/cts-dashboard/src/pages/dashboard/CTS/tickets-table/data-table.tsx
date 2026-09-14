import * as React from "react";
import { DataGrid, type GridColDef, type GridValidRowModel } from "@rdx/ui";

interface DataTableProps<TData extends GridValidRowModel & { id: string }> {
  columns: GridColDef<TData>[];
  data: TData[];
}

export function DataTable<TData extends GridValidRowModel & { id: string }>({
  columns,
  data,
}: DataTableProps<TData>) {
  const [rows, setRows] = React.useState(data);
  const [dataSnapshot, setDataSnapshot] = React.useState(data);

  if (data !== dataSnapshot) {
    setDataSnapshot(data);
    setRows(data);
  }

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      label="Tickets"
      height="calc(100vh - 200px)"
      getRowId={(row) => row.id}
      processRowUpdate={(updatedRow) => {
        setRows((current) =>
          current.map((row) => (row.id === updatedRow.id ? updatedRow : row)),
        );
        return updatedRow;
      }}
      sx={{ padding: "10px" }}
    />
  );
}
