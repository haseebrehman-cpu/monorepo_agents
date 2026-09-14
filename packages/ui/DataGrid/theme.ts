import { createTheme } from "@mui/material/styles";
import type {} from "@mui/x-data-grid-premium/themeAugmentation";

export function createDataGridTheme(isDark: boolean) {
  return createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
      primary: {
        main: "#465fff",
      },
      text: {
        primary: isDark ? "#f2f4f7" : "#1d2939",
        secondary: isDark ? "#98a2b3" : "#475467",
      },
      divider: isDark ? "#1f2937" : "#f2f4f7",
      background: {
        default: isDark ? "#0c111d" : "#ffffff",
        paper: isDark ? "#111827" : "#ffffff",
      },
    },
    typography: {
      fontFamily: "inherit",
      fontSize: 13,
    },
    shape: {
      borderRadius: 8,
    },
  });
}

export const dataGridTheme = createDataGridTheme(false);
