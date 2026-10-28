import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Checkbox, DropDown, Input, Textarea, cn } from "@rdx/ui";
import { toast } from "react-toastify";
import { useCreateRefund, useRefundOptions } from "../../../lib/use-refunds";
import { useCreateResend, useResendOptions } from "../../../lib/use-resends";
import type { RefundLookupKind } from "../../../lib/admin-api";
import QuickAddLookup from "../../molecules/QuickAddLookup";
import {
  ACCOUNTABLE_OPTIONS,
  COURIER_OPTIONS,
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  ITEM_RETURNED_OPTIONS,
  REASON_OPTIONS,
  SALE_CHANNEL_OPTIONS,
  TAG_OPTIONS,
  TYPE_OPTIONS,
} from "./options";

export type CategoryTicketKind = "refund" | "resend" | "return";

const COPY: Record<
  CategoryTicketKind,
  { submit: string; toast: string }
> = {
  refund: {
    submit: "Create Refund",
    toast: "Refund ticket form is UI-only for now.",
  },
  resend: {
    submit: "Create Resend",
    toast: "Resend ticket form is UI-only for now.",
  },
  return: {
    submit: "Create Return",
    toast: "Return ticket form is UI-only for now.",
  },
};

const SHARED_REQUIRED_FIELDS = [
  "referenceNo",
  "type",
  "salesChannel",
  "sku",
  "title",
  "quantity",
  "salePrice",
  "shippingCost",
  "country",
  "reason",
  "tags",
  "accountable",
  "itemReturned",
  "buyerComment",
] as const;

const REFUND_MONEY_FIELDS = ["refundCurrency", "refundPrice"] as const;

function requiredFieldsFor(kind: CategoryTicketKind): (keyof FormState)[] {
  const fields: (keyof FormState)[] = [...SHARED_REQUIRED_FIELDS];
  if (kind !== "resend") {
    fields.push(...REFUND_MONEY_FIELDS);
  }
  if (kind === "refund" || kind === "resend") {
    fields.push("comment");
  }
  return fields;
}

type FormState = {
  referenceNo: string;
  orderId: string;
  categoryName: string;
  email: string;
  type: string;
  salesChannel: string;
  sku: string;
  title: string;
  quantity: string;
  salePrice: string;
  refundCurrency: string;
  refundPrice: string;
  shippingCost: string;
  country: string;
  courierService: string;
  trackingNumber: string;
  reason: string;
  tags: string;
  accountable: string;
  itemReturned: string;
  buyerComment: string;
  comment: string;
  issueListing: boolean;
  issueWarehouse: boolean;
  issueLogistics: boolean;
  issueFactory: boolean;
};

const EMPTY_FORM: FormState = {
  referenceNo: "",
  orderId: "",
  categoryName: "",
  email: "",
  type: "",
  salesChannel: "",
  sku: "",
  title: "",
  quantity: "",
  salePrice: "",
  refundCurrency: "GBP",
  refundPrice: "",
  shippingCost: "",
  country: "",
  courierService: "",
  trackingNumber: "",
  reason: "",
  tags: "",
  accountable: "",
  itemReturned: "",
  buyerComment: "",
  comment: "",
  issueListing: false,
  issueWarehouse: false,
  issueLogistics: false,
  issueFactory: false,
};

type CategoryTicketFormProps = {
  kind: CategoryTicketKind;
};

const CategoryTicketForm = ({ kind }: CategoryTicketFormProps) => {
  const navigate = useNavigate();
  const copy = COPY[kind];
  const showCategory = kind === "refund" || kind === "resend";
  const showRefundMoney = kind !== "resend";
  const commentRequired = kind === "refund" || kind === "resend";
  const categoryLabel = kind === "refund" ? "Refund" : "Resend";
  const [form, setForm] = useState<FormState>(() =>
    kind === "refund" ? { ...EMPTY_FORM, refundCurrency: "" } : EMPTY_FORM,
  );
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState("");
  const createRefund = useCreateRefund();
  const createResend = useCreateResend();
  const refundOptions = useRefundOptions(kind === "refund");
  const resendOptions = useResendOptions(kind === "resend");
  const apiLists = kind === "refund" ? refundOptions.data : kind === "resend" ? resendOptions.data : undefined;
  const usesApiLists = kind !== "return";
  const isSubmitting = createRefund.isPending || createResend.isPending;

  const listFor = (apiList: string[] | undefined, fallback: string[]) =>
    usesApiLists ? (apiList ?? []) : fallback;

  const setField =
    (id: keyof FormState) =>
      (value: string | boolean) => {
        setForm((prev) => ({ ...prev, [id]: value }));
      };

  const quickAdd = (lookupKind: RefundLookupKind, fieldLabel: string, field: keyof FormState) => {
    const onAdded = (label: string) => setField(field)(label);
    if (kind === "refund") {
      return <QuickAddLookup scope="refund" kind={lookupKind} fieldLabel={fieldLabel} onAdded={onAdded} />;
    }
    if (kind === "resend" && lookupKind !== "currency") {
      return <QuickAddLookup scope="resend" kind={lookupKind} fieldLabel={fieldLabel} onAdded={onAdded} />;
    }
    return null;
  };

  const handleText =
    (id: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setField(id)(event.target.value);
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const missing = requiredFieldsFor(kind).some((field) => !String(form[field]).trim());
    if (missing) {
      setError("Please complete all required fields.");
      return;
    }
    setError("");
    if (kind === "refund") {
      createRefund.mutate(
        { ...form, attachments },
        { onSuccess: () => navigate("/refund") }
      );
      return;
    }
    if (kind === "resend") {
      createResend.mutate(
        { ...form, attachments },
        { onSuccess: () => navigate("/resend") }
      );
      return;
    }
    toast.info(copy.toast);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
        {showCategory ? (
          <Field label="Category" htmlFor="category" required>
            <Input id="category" value={categoryLabel} readOnly />
          </Field>
        ) : null}
        <Field label="Reference No" htmlFor="referenceNo" required>
          <Input
            id="referenceNo"
            value={form.referenceNo}
            onChange={handleText("referenceNo")}
            placeholder="Reference No."
          />
        </Field>
        <Field label="Order Id" htmlFor="orderId">
          <Input
            id="orderId"
            value={form.orderId}
            onChange={handleText("orderId")}
            placeholder="Order Id"
          />
        </Field>
        <Field label="Category Name" htmlFor="categoryName">
          <Input
            id="categoryName"
            value={form.categoryName}
            onChange={handleText("categoryName")}
            placeholder="Category Name"
          />
        </Field>
        <Field label="Email Address" htmlFor="email">
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={handleText("email")}
            placeholder="Email Address"
          />
        </Field>
        <Field label="Type" htmlFor="type" required action={quickAdd("type", "Type", "type")}>
          <SelectField
            id="type"
            value={form.type}
            onChange={setField("type")}
            options={listFor(apiLists?.types, TYPE_OPTIONS)}
            placeholder="--Select Type--"
          />
        </Field>
        <Field
          label="Sales Channel"
          htmlFor="salesChannel"
          required
          action={quickAdd("sales_channel", "Sales channel", "salesChannel")}
        >
          <SelectField
            id="salesChannel"
            value={form.salesChannel}
            onChange={setField("salesChannel")}
            options={listFor(apiLists?.salesChannels, SALE_CHANNEL_OPTIONS)}
            placeholder="Select Sale Channel"
          />
        </Field>
        <Field label="SKU" htmlFor="sku" required>
          <Input id="sku" value={form.sku} onChange={handleText("sku")} placeholder="SKU" />
        </Field>
        <Field label="Title" htmlFor="title" required>
          <Input
            id="title"
            value={form.title}
            onChange={handleText("title")}
            placeholder="Product Title"
          />
        </Field>
        <Field label="Quantity" htmlFor="quantity" required>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={form.quantity}
            onChange={handleText("quantity")}
            placeholder="Quantity"
          />
        </Field>
        <Field label="Sale Price" htmlFor="salePrice" required>
          <MoneyInput
            id="salePrice"
            value={form.salePrice}
            onChange={handleText("salePrice")}
            placeholder="Product Price"
          />
        </Field>
        {showRefundMoney ? (
          <>
            <Field
              label="Refund Currency"
              htmlFor="refundCurrency"
              required
              action={quickAdd("currency", "Currency", "refundCurrency")}
            >
              <SelectField
                id="refundCurrency"
                value={form.refundCurrency}
                onChange={setField("refundCurrency")}
                options={listFor(refundOptions.data?.currencies, CURRENCY_OPTIONS)}
                placeholder="Select Currency"
              />
            </Field>
            <Field label="Refund Price" htmlFor="refundPrice" required>
              <MoneyInput
                id="refundPrice"
                value={form.refundPrice}
                onChange={handleText("refundPrice")}
                placeholder="Product Refund Price"
              />
            </Field>
          </>
        ) : null}
        <Field label="Shipping Cost" htmlFor="shippingCost" required>
          <MoneyInput
            id="shippingCost"
            value={form.shippingCost}
            onChange={handleText("shippingCost")}
            placeholder="Shipping"
          />
        </Field>
        <Field label="Country" htmlFor="country" required>
          <SelectField
            id="country"
            value={form.country}
            onChange={setField("country")}
            options={listFor(apiLists?.countries, COUNTRY_OPTIONS)}
            placeholder="Select Country"
          />
        </Field>
        <Field label="Courier Service" htmlFor="courierService">
          {usesApiLists ? (
            <Input
              id="courierService"
              value={form.courierService}
              onChange={handleText("courierService")}
              placeholder="Courier Service"
            />
          ) : (
            <SelectField
              id="courierService"
              value={form.courierService}
              onChange={setField("courierService")}
              options={COURIER_OPTIONS}
              placeholder="Courier Service"
            />
          )}
        </Field>
        <Field label="Tracking Number" htmlFor="trackingNumber">
          <Input
            id="trackingNumber"
            value={form.trackingNumber}
            onChange={handleText("trackingNumber")}
            placeholder="Tracking Number"
          />
        </Field>
        <Field label="Reason" htmlFor="reason" required action={quickAdd("reason", "Reason", "reason")}>
          <SelectField
            id="reason"
            value={form.reason}
            onChange={setField("reason")}
            options={listFor(apiLists?.reasons, REASON_OPTIONS)}
            placeholder="--Select Reason--"
          />
        </Field>
        <Field label="Tags" htmlFor="tags" required action={quickAdd("tag", "Tag", "tags")}>
          <SelectField
            id="tags"
            value={form.tags}
            onChange={setField("tags")}
            options={listFor(apiLists?.tags, TAG_OPTIONS)}
            placeholder="--Select Tag--"
          />
        </Field>
        <Field
          label="Accountable"
          htmlFor="accountable"
          required
          action={quickAdd("accountable", "Accountable", "accountable")}
        >
          <SelectField
            id="accountable"
            value={form.accountable}
            onChange={setField("accountable")}
            options={listFor(apiLists?.accountables, ACCOUNTABLE_OPTIONS)}
            placeholder="--Select Department--"
          />
        </Field>
        <Field label="Item Returned" htmlFor="itemReturned" required>
          <SelectField
            id="itemReturned"
            value={form.itemReturned}
            onChange={setField("itemReturned")}
            options={usesApiLists ? (apiLists?.itemReturned ?? ["True", "False"]) : ITEM_RETURNED_OPTIONS}
            placeholder="-- Select --"
          />
        </Field>
        <Field label="Buyer Comment" htmlFor="buyerComment" required className="md:col-span-2">
          <Textarea
            id="buyerComment"
            value={form.buyerComment}
            onChange={handleText("buyerComment")}
          />
        </Field>
        <Field label="Comment" htmlFor="comment" required={commentRequired} className="md:col-span-2">
          <Textarea
            id="comment"
            value={form.comment}
            onChange={handleText("comment")}
          />
        </Field>
        <Field label="Attachment" htmlFor="attachments" className="md:col-span-2">
          <div className="flex w-full items-center justify-center">
            <label
              htmlFor="attachments"
              className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:bg-slate-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="mb-3 h-8 w-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mb-1 text-sm text-slate-500">
                  <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-400">PNG, JPG, PDF up to 10MB</p>
              </div>
              <Input
                id="attachments"
                type="file"
                multiple
                accept="image/png,image/jpeg,application/pdf"
                className="hidden"
                onChange={(event) => setAttachments(Array.from(event.target.files || []))}
              />
            </label>
          </div>
          {attachments.length > 0 ? (
            <div className="mt-3 space-y-2">
              {attachments.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="truncate text-slate-700">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setAttachments((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
                    }
                    className="h-auto px-2 text-xs font-medium text-red-500 hover:bg-transparent hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:col-span-2">
          <IssueToggle
            id="issueListing"
            label="Issue with Listing"
            checked={form.issueListing}
            onChange={(checked) => setField("issueListing")(checked)}
          />
          <IssueToggle
            id="issueWarehouse"
            label="Issue with Warehouse"
            checked={form.issueWarehouse}
            onChange={(checked) => setField("issueWarehouse")(checked)}
          />
          <IssueToggle
            id="issueLogistics"
            label="Issue with Logistics"
            checked={form.issueLogistics}
            onChange={(checked) => setField("issueLogistics")(checked)}
          />
          <IssueToggle
            id="issueFactory"
            label="Issue with Factory"
            checked={form.issueFactory}
            onChange={(checked) => setField("issueFactory")(checked)}
          />
        </div>
      </div>

      {error ? <p className="px-4 pb-2 text-sm text-red-600">{error}</p> : null}

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {copy.submit}
        </Button>
      </div>
    </form>
  );
};

function Field({
  label,
  htmlFor,
  required,
  className,
  action,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  className?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
          {label}
          {required ? <span className="text-red-500">*</span> : null}:
        </label>
        {action}
      </div>
      {children}
    </div>
  );
}

function MoneyInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      <Input
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="rounded-none border-0 focus-visible:ring-0"
      />
    </div>
  );
}

function SelectField({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <DropDown
      id={id}
      options={options}
      value={value || null}
      onChange={(next) => onChange(next ?? "")}
      label={placeholder}
      className="w-full"
    />
  );
}

function IssueToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-slate-700">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onChange}
      />
      {label}:
    </label>
  );
}

export default CategoryTicketForm;
