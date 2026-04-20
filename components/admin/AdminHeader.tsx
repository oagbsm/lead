

type AdminHeaderProps = {
  saving: boolean;
  selectedCount: number;
  queuedCount: number;
  onAddSelected: () => void;
  onClearQueue: () => void;
};

export default function AdminHeader({
  saving,
  selectedCount,
  queuedCount,
  onAddSelected,
  onClearQueue,
}: AdminHeaderProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Lead Admin Panel</h1>
          <p className="mt-2 text-sm text-black/60">
            Open leads stay in the queue builder. Leads with outcomes move into worked leads, where you can still review notes and close them.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onAddSelected}
            disabled={saving || selectedCount === 0}
            className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/85 disabled:opacity-40"
          >
            {saving ? "Saving..." : `Add selected to queue (${selectedCount})`}
          </button>
          <button
            onClick={onClearQueue}
            disabled={saving || queuedCount === 0}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-40"
          >
            Clear today’s queue
          </button>
        </div>
      </div>
    </div>
  );
}