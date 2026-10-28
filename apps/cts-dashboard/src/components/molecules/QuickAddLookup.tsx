import { useState, type FormEvent } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
} from "@rdx/ui";
import { LoaderCircleIcon, PlusIcon } from "lucide-react";
import type { RefundLookupKind, TicketLookupKind } from "../../lib/admin-api";
import { useCreateRefundLookup, useCreateTicketLookup } from "../../lib/use-admin";
import { hasPermission, P } from "../../lib/permissions";
import { useMe } from "../../lib/use-me";

type LookupTarget =
  | { scope: "ticket"; kind: Exclude<TicketLookupKind, "status"> }
  | { scope: "refund"; kind: RefundLookupKind };

type QuickAddLookupProps = LookupTarget & {
  fieldLabel: string;
  onAdded: (label: string) => void;
};

export default function QuickAddLookup({ fieldLabel, onAdded, ...target }: QuickAddLookupProps) {
  const me = useMe();
  const createTicketLookup = useCreateTicketLookup();
  const createRefundLookup = useCreateRefundLookup();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  if (!hasPermission(me.data?.user, P.LOOKUPS_MANAGE)) return null;

  const isPending = createTicketLookup.isPending || createRefundLookup.isPending;
  const fieldName = fieldLabel.toLowerCase();

  const close = () => {
    if (isPending) return;
    setOpen(false);
    setValue("");
  };

  const handleCreated = (response: { data: { label: string } }) => {
    onAdded(response.data.label);
    setOpen(false);
    setValue("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const label = value.trim();
    if (!label) return;
    if (target.scope === "ticket") {
      createTicketLookup.mutate({ kind: target.kind, label }, { onSuccess: handleCreated });
    } else {
      createRefundLookup.mutate({ kind: target.kind, label }, { onSuccess: handleCreated });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Add
      </button>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-w-md p-0">
          <form onSubmit={handleSubmit}>
            <div className="border-b border-slate-200 px-6 py-4">
              <DialogTitle>Add {fieldName}</DialogTitle>
              <DialogDescription className="mt-1">
                The new {fieldName} is added to this dropdown for everyone and selected here.
              </DialogDescription>
            </div>

            <div className="px-6 py-5">
              <Input
                autoFocus
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={`New ${fieldName}`}
                maxLength={80}
                required
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={close}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending || !value.trim()}>
                {isPending ? (
                  <>
                    <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
