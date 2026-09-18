import * as React from "react";
import { DataGrid, type GridColDef, type GridValidRowModel } from "@rdx/ui";

interface DataTableProps<TData extends GridValidRowModel & { id: string }> {
  columns: GridColDef<TData>[];
  data: TData[];
  processRowUpdate?: (newRow: TData, oldRow: TData) => Promise<TData> | TData;
}

export function DataTable<TData extends GridValidRowModel & { id: string }>({
  columns,
  data,
  processRowUpdate,
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
      processRowUpdate={async (updatedRow, originalRow) => {
        const nextRow = processRowUpdate
          ? await processRowUpdate(updatedRow, originalRow)
          : updatedRow;
        setRows((current) =>
          current.map((row) => (row.id === nextRow.id ? nextRow : row)),
        );
        return nextRow;
      }}
      onProcessRowUpdateError={() => undefined}
      sx={{ padding: "10px" }}
    />
  );
}
