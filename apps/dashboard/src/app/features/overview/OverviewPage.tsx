import { HomeIcon, KpiCards } from "@rdx/ui";

export default function OverviewPage() {
  return (
    <div className="mx-auto flex max-w-full flex-col gap-4">
      <KpiCards title="Welcome Back, RDX" icon={<HomeIcon className="h-5 w-5" />} descriptionText="RDX AI Agents has resolved 2,840 inquiries today with an automated deflection rate of 94.2%." />
      <p className="text-sm text-slate-600">
        Manage the shopping assistant from here. Use the sidebar to move between
        sections.
      </p>
      <div className="flex min-h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
        <p className="max-w-sm text-sm text-slate-400">
          Main content area — add overview widgets and pages here.
        </p>
      </div>
    </div>
  );
}
