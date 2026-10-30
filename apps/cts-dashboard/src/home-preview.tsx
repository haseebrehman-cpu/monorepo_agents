import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import "./index.css";
import HomeDashboard from "./pages/dashboard/Home/HomeDashboard";

if (new URLSearchParams(location.search).has("dark")) document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MemoryRouter>
      <div className="min-h-dvh bg-slate-50 p-4 dark:bg-background">
        <HomeDashboard />
      </div>
    </MemoryRouter>
  </StrictMode>,
);
