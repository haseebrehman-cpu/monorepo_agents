import type { GridColDef } from "@rdx/ui";

export type RefundRow = {
  id: string;
  category: string;
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
  attachment: string;
  issueListing: string;
  issueWarehouse: string;
  issueLogistics: string;
  issueFactory: string;
};

export const refundColumns: GridColDef<RefundRow>[] = [
  { field: "category", headerName: "Category", width: 120 },
  { field: "referenceNo", headerName: "Reference No", width: 150 },
  { field: "orderId", headerName: "Order Id", width: 140 },
  { field: "categoryName", headerName: "Category Name", flex: 1, minWidth: 160 },
  { field: "email", headerName: "Email Address", flex: 1, minWidth: 180 },
  { field: "type", headerName: "Type", width: 120 },
  { field: "salesChannel", headerName: "Sales Channel", flex: 1, minWidth: 150 },
  { field: "sku", headerName: "SKU", width: 140 },
  { field: "title", headerName: "Title", flex: 1, minWidth: 180 },
  { field: "quantity", headerName: "Quantity", width: 110 },
  { field: "salePrice", headerName: "Sale Price", width: 130 },
  { field: "refundCurrency", headerName: "Refund Currency", width: 150 },
  { field: "refundPrice", headerName: "Refund Price", width: 140 },
  { field: "shippingCost", headerName: "Shipping Cost", width: 140 },
  { field: "country", headerName: "Country", width: 140 },
  { field: "courierService", headerName: "Courier Service", flex: 1, minWidth: 150 },
  { field: "trackingNumber", headerName: "Tracking Number", flex: 1, minWidth: 160 },
  { field: "reason", headerName: "Reason", flex: 1, minWidth: 160 },
  { field: "tags", headerName: "Tags", width: 140 },
  { field: "accountable", headerName: "Accountable", flex: 1, minWidth: 160 },
  { field: "itemReturned", headerName: "Item Returned", width: 140 },
  { field: "buyerComment", headerName: "Buyer Comment", flex: 1, minWidth: 180 },
  { field: "comment", headerName: "Comment", flex: 1, minWidth: 180 },
  { field: "attachment", headerName: "Attachment", flex: 1, minWidth: 160 },
  { field: "issueListing", headerName: "Issue with Listing", width: 160 },
  { field: "issueWarehouse", headerName: "Issue with Warehouse", width: 180 },
  { field: "issueLogistics", headerName: "Issue with Logistics", width: 180 },
  { field: "issueFactory", headerName: "Issue with Factory", width: 170 },
];
