import { InvoiceStatus } from "@/lib/types";

const STYLES: Record<InvoiceStatus, string> = {
  Draft: "bg-stone-200 text-stone-700",
  Pending: "bg-amber-100 text-amber-800",
  Approved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-red-100 text-red-800",
  Paid: "bg-teal-100 text-teal-800",
};

export default function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
