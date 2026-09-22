import GoBack from "../../../components/molecules/GoBack";
import BulkUpload from "../../../components/atoms/BulkUpload";
import { useState } from "react";
import { Button } from "@rdx/ui";
import { DownloadIcon, LoaderCircleIcon, UploadIcon } from "lucide-react";
import { useBulkUploadTickets } from "../../../lib/use-tickets";
import { useNavigate } from "react-router-dom";

const AddBulkTickets = () => {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploaderKey, setUploaderKey] = useState(0);
  const upload = useBulkUploadTickets();
  const navigate = useNavigate();
  const clearFile = () => {
    setAttachments([]);
    setUploaderKey((current) => current + 1);
    navigate("/tracking");
  };

  const downloadTemplate = () => {
    const link = document.createElement("a");
    link.href = `${import.meta.env.BASE_URL}templates/bulk-tickets-template.xlsx`;
    link.download = "bulk-tickets-template.xlsx";
    link.click();
  };

  const handleSubmit = () => {
    if (attachments.length === 0) return;
    const file = attachments[0];
    if (!file) return;
    upload.mutate(file, { onSuccess: clearFile });
  };

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <GoBack />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Add Bulk Tickets
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload file to create multiple tickets at once.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={downloadTemplate}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Download Sample
        </Button>
      </div>

      {/* Upload area */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <BulkUpload
          key={uploaderKey}
          onFilesChange={setAttachments}
          onRemove={() => setAttachments([])}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={clearFile}
          disabled={attachments.length === 0 || upload.isPending}
        >
          Clear
        </Button>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={attachments.length === 0 || upload.isPending}
        >
          {upload.isPending ? (
            <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UploadIcon className="mr-2 h-4 w-4" />
          )}
          Upload Tickets
        </Button>
      </div>
    </div>
  );
};

export default AddBulkTickets;