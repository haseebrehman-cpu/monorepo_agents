import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Filters from "../../organisms/TrackingFilters/Filters";
import RichTextEditor from "../../molecules/RichTextEditor";
import { useCreateTicket, useTicketOptions } from "../../../lib/use-tickets";

const AddNewTicket = () => {
    const navigate = useNavigate();
    const optionsQuery = useTicketOptions();
    const createTicket = useCreateTicket();
    const [orderId, setOrderId] = useState("");
    const [courier, setCourier] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [issue, setIssue] = useState("");
    const [content, setContent] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [status, setStatus] = useState("Not Started");
    const [attachments, setAttachments] = useState<File[]>([]);
    const [error, setError] = useState("");

    const options = optionsQuery.data;
    const statuses = options?.statuses ?? [];
    const selectedStatus =
        statuses.length > 0 && !statuses.includes(status) ? "Not Started" : status;
    const assigneeOptions = (options?.departments ?? []).map((department) => ({
        label: department.name,
        value: String(department.id),
    }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim() || !courier || !trackingNumber.trim() || !issue) {
            setError("Order ID, courier, tracking number, and issue are required.");
            return;
        }
        setError("");
        createTicket.mutate(
            {
                orderId: orderId.trim(),
                courier,
                trackingNumber: trackingNumber.trim(),
                issue,
                comment: content,
                assignedDepartmentId: assignedTo ? Number(assignedTo) : null,
                status: selectedStatus || "Not Started",
                attachments,
            },
            {
                onSuccess: () => navigate("/tracking"),
            }
        );
    };

    return (
        <div className="">
            <form
                onSubmit={handleSubmit}
                className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-y-1.5 p-4">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="order_id"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Order ID
                        </label>
                        <input
                            id="order_id"
                            type="text"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            placeholder="Enter Order ID"
                            className="w-full rounded-lg border border-slate-300 px-3.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="courier"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Courier
                        </label>
                        <Filters
                            id="courier"
                            value={courier}
                            onChange={setCourier}
                            options={options?.couriers ?? []}
                            placeholder="Select Courier"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="tracking_order_number"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Tracking / Order Number
                        </label>
                        <input
                            id="tracking_order_number"
                            type="text"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="Enter tracking or order number"
                            className="w-full rounded-lg border border-slate-300 px-3.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="issue"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Issue
                        </label>
                        <Filters
                            id="issue"
                            value={issue}
                            onChange={setIssue}
                            options={options?.issues ?? []}
                            placeholder="Select Issue"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="assigned_to"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Assigned To
                        </label>
                        <Filters
                            id="assigned_to"
                            value={assignedTo}
                            onChange={setAssignedTo}
                            options={assigneeOptions}
                            placeholder="Select department"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="status"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Status
                        </label>
                        <Filters
                            id="status"
                            value={selectedStatus}
                            onChange={setStatus}
                            options={statuses}
                            placeholder="Select Status"
                        />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                        <label
                            htmlFor="comment"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Comment
                        </label>
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Write your comment here..."
                            minHeight="140px"
                        />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                        <label
                            htmlFor="attachments"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Attachments
                        </label>
                        <div className="flex items-center justify-center w-full">
                            <label
                                htmlFor="attachments"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg
                                        className="w-8 h-8 mb-3 text-slate-400"
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
                                    <p className="text-xs text-slate-400">
                                        PNG, JPG, PDF up to 10MB
                                    </p>
                                </div>
                                <input
                                    id="attachments"
                                    type="file"
                                    multiple
                                    accept="image/png,image/jpeg,application/pdf"
                                    className="hidden"
                                    onChange={(e) =>
                                        setAttachments(Array.from(e.target.files || []))
                                    }
                                />
                            </label>
                        </div>

                        {attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {attachments.map((file, index) => (
                                    <div
                                        key={`${file.name}-${index}`}
                                        className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-sm"
                                    >
                                        <span className="text-slate-700 truncate">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setAttachments((prev) =>
                                                    prev.filter((_, i) => i !== index)
                                                )
                                            }
                                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {error ? (
                    <p className="px-6 pb-2 text-sm text-red-600">{error}</p>
                ) : null}

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="cursor-pointer px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createTicket.isPending}
                        className="cursor-pointer px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-60"
                    >
                        {createTicket.isPending ? "Creating..." : "Create Ticket"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddNewTicket;
