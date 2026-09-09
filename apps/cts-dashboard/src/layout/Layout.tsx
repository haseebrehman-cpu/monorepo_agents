import Header from "../components/organisms/Header";
import Sidebar from "../components/organisms/Sidebar";
import { getNavLabel, type ActiveNavId } from "../Data/nav";
import { useEffect, useState } from "react";
import HandleRoutes from "../routes/handle_routes";

interface DashboardLayoutProps {
    activeId: ActiveNavId;
    onNavigate: (id: ActiveNavId) => void;
}

export default function DashboardLayout({
    activeId,
    onNavigate,
}: DashboardLayoutProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const title = getNavLabel(activeId);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileOpen]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMobileOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    useEffect(() => {
        const media = window.matchMedia("(min-width: 768px)");
        const onChange = () => {
            if (media.matches) setMobileOpen(false);
        };
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, []);

    const handleNavigate = (id: ActiveNavId) => {
        onNavigate(id);
        setMobileOpen(false);
    };

    return (
        <div className="flex h-dvh overflow-hidden bg-slate-50">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-3 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-slate-900"
            >
                Skip to content
            </a>

            {mobileOpen ? (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
                    aria-label="Close navigation"
                    onClick={() => setMobileOpen(false)}
                />
            ) : null}

            <Sidebar
                activeId={activeId}
                collapsed={collapsed}
                mobileOpen={mobileOpen}
                onNavigate={handleNavigate}
                onToggleCollapse={() => setCollapsed((open) => !open)}
            />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <Header
                    title={title}
                    mobileOpen={mobileOpen}
                    onToggleMobile={() => setMobileOpen((open) => !open)}
                />
                <main
                    id="main-content"
                    className="flex-1 overflow-y-auto p-4 md:p-6"
                >
                    <HandleRoutes />
                </main>
            </div>
        </div>
    );
}
