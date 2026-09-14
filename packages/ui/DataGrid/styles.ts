export const DEFAULT_DATA_GRID_HEIGHT = "calc(100vh - 200px)";

export const getDataGridStyles = (
  height: string = DEFAULT_DATA_GRID_HEIGHT,
) => ({
  border: "none",
  backgroundColor: "transparent",
  width: "100%",
  height,
  minHeight: height === "auto" ? "0" : "400px",
  maxHeight: height === "auto" ? "none" : DEFAULT_DATA_GRID_HEIGHT,
  overflow: "hidden",
  "& .MuiDataGrid-main": {
    backgroundColor: "transparent",
    overflow: "auto",
  },
  "& .MuiDataGrid-container--top [role=row]": {
    backgroundColor: "transparent",
  },
  "& .MuiDataGrid-virtualScroller": {
    backgroundColor: "transparent",
  },
  "& .MuiDataGrid-row": {
    backgroundColor: "transparent !important",
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.02) !important",
    },
  },
  "& .MuiDataGrid-cell": {
    borderColor: "#f2f4f7",
    color: "#1d2939",
    backgroundColor: "transparent",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
  },
  "& .MuiDataGrid-columnHeaders": {
    borderColor: "#f2f4f7",
    backgroundColor: "#f9fafb",
    color: "#101828",
    borderBottomWidth: "1px",
  },
  "& .MuiDataGrid-columnHeader": {
    backgroundColor: "#f9fafb",
    "&:focus": {
      outline: "none",
    },
  },
  "& .MuiDataGrid-columnHeaderTitle": {
    color: "#475467",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  "& .MuiDataGrid-footerContainer": {
    borderColor: "#f2f4f7",
    backgroundColor: "transparent",
  },
  "& .MuiTablePagination-root": {
    color: "#475467",
  },
  "& .MuiIconButton-root": {
    color: "#667085",
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.05)",
    },
  },
  "& .MuiDataGrid-selectedRowCount": {
    color: "#475467",
  },
  "& .MuiDataGrid-columnSeparator": {
    color: "#f2f4f7",
  },
  "& .MuiDataGrid-sortIcon": {
    color: "#667085",
  },
  "& .MuiDataGrid-menuIconButton": {
    color: "#667085",
  },
  "& .MuiDataGrid-iconButtonContainer": {
    color: "#667085",
  },
  "& .MuiDataGrid-columnHeader .MuiIconButton-root": {
    color: "#667085",
  },
  "& .MuiLinearProgress-root": {
    backgroundColor: "rgba(4, 122, 219, 0.05)",
  },
  "& .MuiLinearProgress-bar": {
    backgroundColor: "#047ADB",
  },
  /* Specific target for MUI X License Watermark */
  '& div[style*="z-index: 100000"], & div[style*="z-index: 100000;"]': {
    display: 'none !important',
    visibility: 'hidden !important',
    opacity: '0 !important',
    pointerEvents: 'none !important',
  },
  ...getDataGridFormControlStyles(),
});

export const getFormControlStyles = () => ({
  display: "flex",
  flexDirection: "row" as const,
  alignItems: "center",
  justifyContent: "space-between",
  gap: 2,
  ...getDataGridFormControlStyles(),
});

export const getDataGridFormControlStyles = () => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: "white",
    borderRadius: "8px",
    "& fieldset": {
      borderColor: "#d0d5dd",
    },
    "&:hover fieldset": {
      borderColor: "#98a2b3",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#465fff",
      borderWidth: "1px",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#667085",
    "&.Mui-focused": {
      color: "#465fff",
    },
  },
  "& .MuiSelect-select": {
    color: "#1d2939",
    fontSize: "14px",
    padding: "10px 14px",
  },
  "& .MuiSelect-icon": {
    color: "#667085",
  },
});
