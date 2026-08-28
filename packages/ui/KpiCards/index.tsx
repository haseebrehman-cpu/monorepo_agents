interface KpiCardsProps {
    title: string;
    value?: number;
    icon: React.ReactNode;
    descriptionText?: string;
}

export default function KpiCards({ title, value, icon, descriptionText }: KpiCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 w-full">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-indigo-100 text-indigo-700">
                        <p className="text-xs font-medium">{icon}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-slate-500">{title}</p>
                        
                    </div>
                </div>
                <div className="my-2">
                    <p className="text-xs text-slate-500">{descriptionText}</p>
                </div>
            </div>
        </div>
    )
}