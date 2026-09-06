export type InvoiceStatus = "Draft" | "Pending" | "Approved" | "Rejected" | "Paid";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendor: string;
  vendorAddress: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  gstNumber: string;
  currency: string;
  category: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  fileName: string;
  fileDataUrl: string;
  items: InvoiceItem[];
  aiSummary: string;
  aiRecommendation: string;
  aiRisk: "Low" | "Medium" | "High";
  aiFlags: string[];
  createdBy: string;
  createdAt: string;
  statusHistory: { status: InvoiceStatus; at: string }[];
}

export type UserRole = "Admin" | "Manager" | "User";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  message: string;
  type: "upload" | "approved" | "rejected" | "due" | "paid";
  createdAt: string;
  read: boolean;
}
