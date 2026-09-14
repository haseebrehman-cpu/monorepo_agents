import { ThemeProvider } from "@mui/material/styles";
import {
  DataGridPremium,
  GridChartsIntegrationContextProvider,
  // GridChartsPanel,
  // GridChartsRendererProxy,
  type DataGridPremiumProps,
  type GridValidRowModel,
} from "@mui/x-data-grid-premium";
import { formulaFeature } from "@mui/x-data-grid-premium/formula";
// import { ChartsRenderer } from "@mui/x-charts-premium/ChartsRenderer";
import {
  DEFAULT_DATA_GRID_HEIGHT,
  getDataGridStyles,
} from "./styles";
import { dataGridTheme } from "./theme";

export type DataGridProps<R extends GridValidRowModel = GridValidRowModel> =
  DataGridPremiumProps<R> & {
    height?: number | string;
    isDark?: boolean;
  };

const DEFAULT_PAGE_SIZE = 10;

export function DataGrid<R extends GridValidRowModel = GridValidRowModel>({
  height = DEFAULT_DATA_GRID_HEIGHT,
  className,
  slots,
  slotProps,
  initialState,
  sx,
  checkboxSelection = true,
  disableRowSelectionOnClick = true,
  showToolbar = true,
  cellSelection = true,
  cellSelectionFillHandle = true,
  // headerFilters = true,
  // chartsIntegration = true,
  pagination = true,
  pageSizeOptions = [10, 25, 50, 100],
  ignoreValueFormatterDuringExport = true,
  historyStackSize = 0,
  featureDependencies,
  ...props
}: DataGridProps<R>) {
  const heightValue = typeof height === "number" ? `${height}px` : height;

  return (
    <ThemeProvider theme={dataGridTheme}>
      <GridChartsIntegrationContextProvider>
        <div
          className={
            className ??
            "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
          }
        >
          <DataGridPremium
            checkboxSelection={checkboxSelection}
            disableRowSelectionOnClick={disableRowSelectionOnClick}
            showToolbar={showToolbar}
            cellSelection={cellSelection}
            cellSelectionFillHandle={cellSelectionFillHandle}
            // headerFilters={headerFilters}
            // chartsIntegration={chartsIntegration}
            pagination={pagination}
            pageSizeOptions={pageSizeOptions}
            ignoreValueFormatterDuringExport={
              ignoreValueFormatterDuringExport
            }
            historyStackSize={historyStackSize}
            slotProps={{
              ...slotProps,
              toolbar: {
                showQuickFilter: true,
                showHistoryControls: false,
                ...(typeof slotProps?.toolbar === "object"
                  ? slotProps.toolbar
                  : {}),
              },
            }}
            featureDependencies={{
              formula: formulaFeature,
              ...featureDependencies,
            }}
            slots={{
              // chartsPanel: GridChartsPanel,
              ...slots,
            }}
            initialState={{
              ...initialState,
              pagination: {
                paginationModel: {
                  page: 0,
                  pageSize: DEFAULT_PAGE_SIZE,
                },
                ...initialState?.pagination,
              },
            }}
            sx={{
              ...getDataGridStyles(heightValue),
              ...sx,
            }}
            {...props}
          />
          {/* {chartsIntegration ? (
            <GridChartsRendererProxy id="main" renderer={ChartsRenderer} />
          ) : null} */}
        </div>
      </GridChartsIntegrationContextProvider>
    </ThemeProvider>
  );
}

export {
  DataGridPremium,
  GRID_CHECKBOX_SELECTION_FIELD,
  GridActionsCellItem,
} from "@mui/x-data-grid-premium";
export type {
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
  GridRowsProp,
  GridValidRowModel,
} from "@mui/x-data-grid-premium";
