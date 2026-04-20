

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type LeadRow = {
  id: string;
  sequence_number?: number;
  business_name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  locations?: {
    city?: string | null;
    state_region?: string | null;
    country?: string | null;
  } | null;
  status?: string | null;
};

type LeadCallRow = {
  id: string;
  lead_id: string;
  outcome: string;
  note?: string | null;
  created_at: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function buildLocation(lead: LeadRow) {
  const parts = [lead.locations?.city, lead.locations?.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "No location";
}

function outcomeTone(outcome?: string | null) {
  if (!outcome) return "bg-black/5 text-black/55 border-black/10";
  if (["interested", "converted"].includes(outcome)) return "bg-green-50 text-green-700 border-green-200";
  if (["callback", "sent_info"].includes(outcome)) return "bg-blue-50 text-blue-700 border-blue-200";
  if (["not_interested", "bad_lead", "wrong_number"].includes(outcome)) return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

type Props = {
  selectedLead: LeadRow | null;
  selectedLeadCalls: LeadCallRow[];
  leadDetailsLoading: boolean;
  saving: boolean;
  onCloseLead: (leadId: string) => void;
};

export default function LeadOutcomeDetail({
  selectedLead,
  selectedLeadCalls,
  leadDetailsLoading,
  saving,
  onCloseLead,
}: Props) {
  const [localCalls, setLocalCalls] = useState<LeadCallRow[]>(selectedLeadCalls);
  const [newOutcome, setNewOutcome] = useState("callback");
  const [newNote, setNewNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    setLocalCalls(selectedLeadCalls);
  }, [selectedLeadCalls, selectedLead?.id]);

  async function handleAddUpdate() {
    if (!selectedLead || !newNote.trim() || isSavingNote) return;

    setIsSavingNote(true);

    try {
      const payload = {
        lead_id: selectedLead.id,
        outcome: newOutcome,
        note: newNote.trim(),
      };

      const { data, error } = await supabase
        .from("lead_calls")
        .insert(payload)
        .select("id, lead_id, outcome, note, created_at")
        .single();

      if (error) {
        console.error("Error adding lead update:", error);
        return;
      }

      if (data) {
        setLocalCalls((current) => [data as LeadCallRow, ...current]);
      }

      setNewNote("");
    } finally {
      setIsSavingNote(false);
    }
  }
  if (!selectedLead) {
    return (
      <div className="rounded-xl border border-dashed border-black/10 bg-[#fafafa] p-4 text-sm text-black/55">
        Select a worked lead to see outcomes and notes.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-black/10 bg-[#fcfcfc] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-base font-semibold text-black">
              #{selectedLead.sequence_number ?? "-"} {selectedLead.business_name}
            </div>
            <div className="mt-1 text-sm text-black/55">
              {selectedLead.contact_name || "No contact"} • {selectedLead.phone || "No phone"}
            </div>
            <div className="mt-1 text-sm text-black/55">{selectedLead.email || "No email"}</div>
            <div className="mt-1 text-sm text-black/55">{buildLocation(selectedLead)}</div>
          </div>
          <button
            onClick={() => onCloseLead(selectedLead.id)}
            disabled={saving || selectedLead.status === "closed"}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium transition hover:bg-black/5 disabled:opacity-40"
          >
            {selectedLead.status === "closed" ? "Lead closed" : saving ? "Saving..." : "Close lead"}
          </button>
        </div>
        <div className="mt-4 border-t border-black/10 pt-4">
          <div className="mb-3 text-sm font-medium text-black">Add update</div>

          <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
            <select
              value={newOutcome}
              onChange={(e) => setNewOutcome(e.target.value)}
              disabled={isSavingNote || saving || selectedLead.status === "closed"}
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none disabled:opacity-40"
            >
              <option value="callback">Callback</option>
              <option value="interested">Interested</option>
              <option value="sent_info">Sent info</option>
              <option value="converted">Converted</option>
              <option value="not_interested">Not interested</option>
              <option value="bad_lead">Bad lead</option>
            </select>

            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              disabled={isSavingNote || saving || selectedLead.status === "closed"}
              placeholder="Add a follow up note or update..."
              className="min-h-[110px] rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none disabled:opacity-40"
            />
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={handleAddUpdate}
              disabled={isSavingNote || saving || selectedLead.status === "closed" || !newNote.trim()}
              className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/85 disabled:opacity-40"
            >
              {isSavingNote ? "Saving update..." : "Save update"}
            </button>
          </div>
        </div>
      </div>

      {leadDetailsLoading ? (
        <div className="text-sm text-black/55">Loading outcomes...</div>
      ) : localCalls.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/10 bg-[#fafafa] p-4 text-sm text-black/55">
          No call outcomes yet for this lead.
        </div>
      ) : (
        <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
          {localCalls.map((call) => (
            <div key={call.id} className="rounded-xl border border-black/10 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${outcomeTone(call.outcome)}`}>
                  {call.outcome}
                </div>
                <div className="text-xs text-black/45">{formatDateTime(call.created_at)}</div>
              </div>
              <div className="mt-3 text-sm text-black/70">{call.note || "No note added."}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}