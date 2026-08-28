export default function UserChip() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700"
        aria-hidden="true"
      >
        AD
      </div>
      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-sm font-medium text-slate-900">Admin</p>
        <p className="truncate text-xs text-slate-500">RDX</p>
      </div>
    </div>
  );
}
