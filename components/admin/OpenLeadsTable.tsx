

type LeadRow = {
  id: string;
  sequence_number?: number;
  business_name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  professions?: {
    name?: string | null;
  } | null;
  locations?: {
    city?: string | null;
    state_region?: string | null;
    country?: string | null;
  } | null;
};

function buildLocation(lead: LeadRow) {
  const parts = [lead.locations?.city, lead.locations?.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "No location";
}

type Props = {
  leads: LeadRow[];
  queuedLeadIds: Set<string>;
  selectedLeadIds: string[];
  onToggleLeadSelection: (leadId: string) => void;
};

export default function OpenLeadsTable({
  leads,
  queuedLeadIds,
  selectedLeadIds,
  onToggleLeadSelection,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/10 bg-[#fafafa] text-left text-black/60">
            <th className="px-4 py-3 font-medium">Pick</th>
            <th className="px-4 py-3 font-medium">Lead</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Profession</th>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 font-medium">Queue</th>
          </tr>
        </thead>

        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-black/50">
                No open leads match your filters.
              </td>
            </tr>
          ) : (
            leads.map((lead) => {
              const isQueued = queuedLeadIds.has(lead.id);
              const isSelected = selectedLeadIds.includes(lead.id);

              return (
                <tr
                  key={lead.id}
                  className="border-b border-black/5 transition hover:bg-black/[0.02]"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleLeadSelection(lead.id)}
                      className="h-4 w-4 rounded border-black/20"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-semibold text-black">
                      #{lead.sequence_number ?? "-"} {lead.business_name}
                    </div>
                    <div className="mt-1 text-xs text-black/50">
                      {lead.status || "new"}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-black/65">
                    <div>{lead.contact_name || "No contact"}</div>
                    <div className="mt-1 text-xs">{lead.phone || "No phone"}</div>
                    <div className="mt-1 text-xs">{lead.email || "No email"}</div>
                  </td>

                  <td className="px-4 py-3 text-black/65">
                    {lead.professions?.name || "-"}
                  </td>

                  <td className="px-4 py-3 text-black/65">
                    {buildLocation(lead)}
                  </td>

                  <td className="px-4 py-3">
                    {isQueued ? (
                      <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        In queue
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-xs font-medium text-black/55">
                        Not queued
                      </span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}