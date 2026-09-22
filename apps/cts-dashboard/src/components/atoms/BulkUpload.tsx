import { Button } from "@rdx/ui";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { FileSpreadsheetIcon, TrashIcon, UploadCloudIcon } from "lucide-react";

type BulkUploadProps = {
    onRemove?: () => void;
    onFilesChange?: (files: File[]) => void;
};

const BulkUpload = ({ onRemove, onFilesChange }: BulkUploadProps) => {
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (files: FileList | null) => {
        const firstFile = files?.item(0);
        const next = firstFile ? [firstFile] : [];
        setAttachments(next);
        onFilesChange?.(next);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    const handleRemove = () => {
        setAttachments([]);
        if (inputRef.current) inputRef.current.value = "";
        onRemove?.();
        onFilesChange?.([]);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    return (
        <div className="flex flex-col gap-3">
            <label className="block text-sm font-medium text-slate-700">
                Attachments
            </label>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`
          relative flex cursor-pointer flex-col items-center justify-center gap-3
          rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors
          ${isDragging
                        ? "border-indigo-400 bg-indigo-50/50"
                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
                    }
        `}
            >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                    <UploadCloudIcon className="h-5 w-5 text-slate-500" />
                </div>

                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-700">
                        Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-slate-500">
                        Excel and CSV files only (.xlsx, .xls, .csv)
                    </p>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    id="attachments"
                    className="sr-only"
                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                    onChange={handleChange}
                />
            </div>

            {attachments.length > 0 && (
                <div className="flex flex-col gap-2">
                    {attachments.map((file) => (
                        <div
                            key={file.name + file.size}
                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                                    <FileSpreadsheetIcon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-800">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleRemove}
                                className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                <TrashIcon className="h-4 w-4" />
                                Remove
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BulkUpload;