export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 font-semibold">
      <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm shadow-sm">
        IV
      </span>
      {!compact && <span>InvoiceVision</span>}
    </div>
  );
}
