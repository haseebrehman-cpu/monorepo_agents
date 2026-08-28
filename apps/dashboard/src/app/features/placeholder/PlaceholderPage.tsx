interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex min-h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="mt-1 text-sm text-slate-400">
          Content
        </p>
      </div>
    </div>
  );
}
