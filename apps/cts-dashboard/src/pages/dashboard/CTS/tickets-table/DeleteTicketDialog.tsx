import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@rdx/ui";
import { LoaderCircleIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import type { Ticket } from "./columns";

type DeleteTicketDialogProps = {
  ticket: Ticket | null;
  open: boolean;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export default function DeleteTicketDialog({
  ticket,
  open,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteTicketDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isDeleting) onOpenChange(nextOpen);
      }}
      disablePointerDismissal={isDeleting}
    >
      <DialogContent>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <TriangleAlertIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle>Delete ticket</DialogTitle>
            <DialogDescription className="mt-1">
              This permanently deletes the ticket and all of its history and attachments.
            </DialogDescription>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            disabled={isDeleting}
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {ticket ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-sm font-medium text-slate-900">{ticket.id}</p>
            <p className="text-sm text-slate-500">Order: {ticket.orderId}</p>
            <p className="text-sm text-slate-500">
              Tracking: {ticket.trackingNumber}
            </p>
          </div>
        ) : null}

        <p className="mt-4 text-sm text-slate-600">This action cannot be undone.</p>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500"
            disabled={isDeleting || !ticket}
            onClick={onConfirm}
          >
            {isDeleting ? (
              <>
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete ticket"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
