

type QueueLead = {
  id: string;
  sequence_number?: number;
  business_name?: string | null;
  phone?: string | null;
  email?: string | null;
};

type QueueRow = {
  id: string;
  lead_id: string;
  queue_order: number;
  leads: QueueLead | null;
};

type Props = {
  queuedLeads: QueueRow[];
  saving: boolean;
  onMove: (row: QueueRow, direction: "up" | "down") => void;
  onRemove: (queueRowId: string) => void;
};

export default function QueueSection({
  queuedLeads,
  saving,
  onMove,
  onRemove,
}: Props) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/10 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Today’s Queue</h2>
            <p className="mt-1 text-sm text-black/55">
              Set the exact order the rep will see leads.
            </p>
          </div>
          <div className="rounded-full bg-black/5 px-3 py-1 text-sm text-black/60">
            {queuedLeads.length}
          </div>
        </div>
      </div>

      <div className="max-h-[560px] overflow-y-auto p-5">
        {queuedLeads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/10 bg-[#fafafa] p-4 text-sm text-black/55">
            No queued leads yet.
          </div>
        ) : (
          <div className="space-y-3">
            {queuedLeads.map((row, index) => (
              <div
                key={row.id}
                className="rounded-xl border border-black/10 bg-[#fcfcfc] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold text-black">
                      {row.queue_order}. #{row.leads?.sequence_number ?? "-"}{" "}
                      {row.leads?.business_name || "Unknown business"}
                    </div>

                    <div className="mt-1 text-sm text-black/55">
                      {row.leads?.phone || "No phone"} • {row.leads?.email || "No email"}
                    </div>

                    <div className="mt-2 text-xs text-black/45">
                      Waiting to be called
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onMove(row, "up")}
                      disabled={saving || index === 0}
                      className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm transition hover:bg-black/5 disabled:opacity-40"
                    >
                      Up
                    </button>

                    <button
                      onClick={() => onMove(row, "down")}
                      disabled={saving || index === queuedLeads.length - 1}
                      className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm transition hover:bg-black/5 disabled:opacity-40"
                    >
                      Down
                    </button>

                    <button
                      onClick={() => onRemove(row.id)}
                      disabled={saving}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 transition hover:bg-red-100 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}