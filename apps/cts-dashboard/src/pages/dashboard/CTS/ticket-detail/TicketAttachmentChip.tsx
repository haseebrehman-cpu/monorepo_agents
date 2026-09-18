import { Paperclip } from "lucide-react";
import { toast } from "react-toastify";
import {
  downloadTicketAttachment,
  type TicketAttachment,
} from "../../../../lib/tickets-api";

export function TicketAttachmentChip({ attachment }: { attachment: TicketAttachment }) {
  const handleDownload = async () => {
    try {
      await downloadTicketAttachment(attachment.id, attachment.fileName);
    } catch {
      toast.error("Could not download attachment.");
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleDownload()}
      className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-emerald-500"
      title={`Download ${attachment.fileName}`}
    >
      <Paperclip className="h-3 w-3 shrink-0" />
      <span className="truncate">{attachment.fileName}</span>
    </button>
  );
}
