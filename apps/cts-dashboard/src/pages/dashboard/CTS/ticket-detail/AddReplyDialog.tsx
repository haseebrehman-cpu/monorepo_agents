import { useMemo, useState, type FormEvent } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@rdx/ui";
import { LoaderCircleIcon, XIcon } from "lucide-react";
import Filters from "../../../../components/organisms/TrackingFilters/Filters";
import RichTextEditor from "../../../../components/molecules/RichTextEditor";
import { useAddTicketReply, useTicketOptions } from "../../../../lib/use-tickets";
import { htmlToText } from "./helpers";

type AddReplyDialogProps = {
  ticketId: string;
  assignedDepartmentId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketCompleted: boolean;
};

function AddReplyForm({
  ticketId,
  assignedDepartmentId,
  onOpenChange,
  ticketCompleted,
}: Omit<AddReplyDialogProps, "open">) {
  const optionsQuery = useTicketOptions();
  const addReply = useAddTicketReply(ticketId);
  const [assignedTo, setAssignedTo] = useState(
    assignedDepartmentId ? String(assignedDepartmentId) : "",
  );
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState("");

  const assigneeOptions = useMemo(
    () =>
      (optionsQuery.data?.departments ?? []).map((department) => ({
        value: String(department.id),
        label: department.name,
      })),
    [optionsQuery.data?.departments],
  );

  const handleClose = () => {
    if (addReply.isPending) return;
    onOpenChange(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!assignedTo) {
      setError("Assigned to is required.");
      return;
    }
    if (!htmlToText(content)) {
      setError("Description is required.");
      return;
    }
    setError("");
    addReply.mutate(
      {
        assignedDepartmentId: Number(assignedTo),
        comment: content,
        attachments,
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <DialogTitle>Ticket reply</DialogTitle>
          <DialogDescription className="mt-1">
            Add a comment, reassign the ticket, and attach supporting files.
          </DialogDescription>
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          disabled={addReply.isPending}
          aria-label="Close"
          onClick={handleClose}
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 px-6 py-5">
        {ticketCompleted ? null : (
          <div className="space-y-1.5">
            <label htmlFor="reply-assigned-to" className="text-sm font-medium text-slate-700">
              Assigned to <span className="text-red-500">*</span>
            </label>
            <Filters
              id="reply-assigned-to"
              value={assignedTo}
              onChange={setAssignedTo}
              options={assigneeOptions}
              placeholder="Select department"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Description <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Write your reply..."
            minHeight="160px"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reply-attachments" className="text-sm font-medium text-slate-700">
            Attachments
          </label>
          <input
            id="reply-attachments"
            type="file"
            multiple
            accept="image/png,image/jpeg,application/pdf"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            onChange={(event) =>
              setAttachments(Array.from(event.target.files ?? []))
            }
          />
          {attachments.length > 0 ? (
            <ul className="space-y-1 pt-1">
              {attachments.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="truncate text-slate-700">{file.name}</span>
                  <button
                    type="button"
                    className="text-xs font-medium text-red-500 hover:text-red-700"
                    onClick={() =>
                      setAttachments((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={addReply.isPending}
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={addReply.isPending}>
          {addReply.isPending ? (
            <>
              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Reply"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function AddReplyDialog({
  ticketId,
  assignedDepartmentId,
  open,
  onOpenChange,
  ticketCompleted
}: AddReplyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        {open ? (
          <AddReplyForm
            key={`${ticketId}-${assignedDepartmentId ?? "none"}`}
            ticketId={ticketId}
            assignedDepartmentId={assignedDepartmentId}
            onOpenChange={onOpenChange}
            ticketCompleted={ticketCompleted}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
