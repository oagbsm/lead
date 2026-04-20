"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type LeadRow = {
  id: string;
  sequence_number?: number;
  business_name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  locations?: {
    city?: string | null;
    state_region?: string | null;
    country?: string | null;
  } | null;
};

type OutcomeSummaryRow = {
  lead_id: string;
  latest_outcome: string | null;
  latest_note: string | null;
  latest_at: string | null;
  call_count: number;
};

type LeadCallRow = {
  id: string;
  lead_id: string;
  outcome: string;
  note?: string | null;
  created_at: string;
};

type Props = {
  leads: LeadRow[];
  outcomeSummaryMap: Record<string, OutcomeSummaryRow>;
  onSelectLead?: (lead: LeadRow) => void;
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
  if (["not_interested", "bad_lead", "wrong_number", "closed"].includes(outcome)) return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export default function FollowUpSection({
  leads,
  outcomeSummaryMap,
  onSelectLead,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"open" | "closed" | "all">("open");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [selectedLeadCalls, setSelectedLeadCalls] = useState<LeadCallRow[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [noteOutcome, setNoteOutcome] = useState("callback");
  const [noteText, setNoteText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [localSummaryMap, setLocalSummaryMap] = useState<Record<string, OutcomeSummaryRow>>(outcomeSummaryMap);
  const [localLeads, setLocalLeads] = useState<LeadRow[]>(leads);

  useEffect(() => {
    setLocalSummaryMap(outcomeSummaryMap);
  }, [outcomeSummaryMap]);

  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  useEffect(() => {
    if (!selectedLead && leads.length > 0) {
      setSelectedLead(leads[0]);
    }
  }, [leads, selectedLead]);

const filteredLeads = useMemo(() => {
  const q = search.trim().toLowerCase();

  return localLeads.filter((lead) => {
    const summary = localSummaryMap[lead.id];
    const haystack = [
      lead.business_name,
      lead.contact_name,
      lead.email,
      lead.phone,
      buildLocation(lead),
      summary?.latest_outcome,
      summary?.latest_note,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !q || haystack.includes(q);
    const isClosed = lead.status === "closed";
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "closed"
          ? isClosed
          : !isClosed;

    return matchesSearch && matchesStatus;
  });
}, [localLeads, localSummaryMap, search, statusFilter]);
  async function loadLeadDetails(lead: LeadRow) {
    setSelectedLead(lead);
    onSelectLead?.(lead);
    setLoadingDetails(true);

    const { data, error } = await supabase
      .from("lead_calls")
      .select("id, lead_id, outcome, note, created_at")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading follow up details:", error);
      setSelectedLeadCalls([]);
      setLoadingDetails(false);
      return;
    }

    setSelectedLeadCalls((data as LeadCallRow[]) ?? []);
    setLoadingDetails(false);
  }

  async function handleSaveUpdate() {
    if (!selectedLead || !noteText.trim() || isSaving) return;

    setIsSaving(true);

    try {
      const payload = {
        lead_id: selectedLead.id,
        outcome: noteOutcome,
        note: noteText.trim(),
      };

      const { data, error } = await supabase
        .from("lead_calls")
        .insert(payload)
        .select("id, lead_id, outcome, note, created_at")
        .single();

      if (error) {
        console.error("Error saving follow up update:", error);
        return;
      }

      const inserted = data as LeadCallRow;
      setSelectedLeadCalls((current) => [inserted, ...current]);
      setLocalSummaryMap((current) => ({
        ...current,
        [selectedLead.id]: {
          lead_id: selectedLead.id,
          latest_outcome: inserted.outcome,
          latest_note: inserted.note ?? null,
          latest_at: inserted.created_at,
          call_count: (current[selectedLead.id]?.call_count ?? 0) + 1,
        },
      }));
      setNoteText("");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCloseLead() {
    if (!selectedLead || isClosing || selectedLead.status === "closed") return;

    setIsClosing(true);

    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: "closed" })
        .eq("id", selectedLead.id);

      if (error) {
        console.error("Error closing lead:", error);
        return;
      }

      setSelectedLead((current) => (current ? { ...current, status: "closed" } : current));
      setLocalLeads((current) =>
        current.map((lead) => (lead.id === selectedLead.id ? { ...lead, status: "closed" } : lead))
      );
      setLocalSummaryMap((current) => ({
        ...current,
        [selectedLead.id]: {
          lead_id: selectedLead.id,
          latest_outcome: current[selectedLead.id]?.latest_outcome ?? "closed",
          latest_note: current[selectedLead.id]?.latest_note ?? null,
          latest_at: current[selectedLead.id]?.latest_at ?? null,
          call_count: current[selectedLead.id]?.call_count ?? 0,
        },
      }));
    } finally {
      setIsClosing(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Follow Ups</h2>
            <p className="mt-1 text-sm text-black/55">
              Keep hot leads in one clean CRM-style workspace. Search quickly, update notes, and close leads when done.
            </p>
          </div>
<div className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search name, email, number, note, or outcome"
    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black/25"
  />

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value as "open" | "closed" | "all")}
    className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
  >
    <option value="open">Open leads</option>
    <option value="closed">Closed leads</option>
    <option value="all">All leads</option>
  </select>
</div>
        </div>
      </div>

      <div className="grid min-h-[560px] gap-0 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="border-r border-black/10">
          <div className="border-b border-black/10 px-5 py-4 text-sm text-black/55">
{filteredLeads.length} {statusFilter === "closed" ? "closed" : statusFilter === "all" ? "follow up" : "open"} lead{filteredLeads.length === 1 ? "" : "s"}          </div>

          <div className="max-h-[700px] overflow-y-auto p-4">
            {filteredLeads.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/10 bg-[#fafafa] p-4 text-sm text-black/55">
                No follow ups found.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLeads.map((lead) => {
                  const summary = localSummaryMap[lead.id];
                  const isActive = selectedLead?.id === lead.id;

                  return (
                    <button
                      key={lead.id}
                      onClick={() => loadLeadDetails(lead)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        isActive
                          ? "border-black/20 bg-black/[0.03]"
                          : "border-black/10 bg-[#fcfcfc] hover:bg-black/[0.02]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-black">{lead.business_name}</div>
                          <div className="mt-1 text-sm text-black/60">{lead.email || "No email"}</div>
                          <div className="mt-1 text-sm text-black/60">{lead.phone || "No phone"}</div>
                          <div className="mt-2 text-sm text-black/60">{summary?.latest_outcome || "No outcome"}</div>
                          <div className="mt-1 text-sm text-black/70 line-clamp-2">
                            {summary?.latest_note || "No notes yet"}
                          </div>
                        </div>
                        <div
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${outcomeTone(
                            lead.status === "closed" ? "closed" : summary?.latest_outcome
                          )}`}
                        >
                          {lead.status === "closed" ? "closed" : summary?.latest_outcome || "open"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-5">
          {!selectedLead ? (
            <div className="rounded-xl border border-dashed border-black/10 bg-[#fafafa] p-4 text-sm text-black/55">
              Select a follow up lead to view details.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-black/10 bg-[#fcfcfc] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-black">
                      #{selectedLead.sequence_number ?? "-"} {selectedLead.business_name}
                    </div>
                    <div className="mt-2 text-sm text-black/60">
                      {selectedLead.contact_name || "No contact name"}
                    </div>
                    <div className="mt-1 text-sm text-black/60">{selectedLead.email || "No email"}</div>
                    <div className="mt-1 text-sm text-black/60">{selectedLead.phone || "No phone"}</div>
                    <div className="mt-1 text-sm text-black/60">{buildLocation(selectedLead)}</div>
                  </div>

                  <button
                    onClick={handleCloseLead}
                    disabled={isClosing || selectedLead.status === "closed"}
                    className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-black/5 disabled:opacity-40"
                  >
                    {selectedLead.status === "closed" ? "Lead closed" : isClosing ? "Closing..." : "Close lead"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <div className="mb-4 text-base font-semibold text-black">Add update</div>
                <div className="grid gap-3 md:grid-cols-[200px_minmax(0,1fr)]">
                  <select
                    value={noteOutcome}
                    onChange={(e) => setNoteOutcome(e.target.value)}
                    disabled={isSaving || selectedLead.status === "closed"}
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
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    disabled={isSaving || selectedLead.status === "closed"}
                    placeholder="Write the latest follow up note here..."
                    className="min-h-[120px] rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none disabled:opacity-40"
                  />
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSaveUpdate}
                    disabled={isSaving || selectedLead.status === "closed" || !noteText.trim()}
                    className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/85 disabled:opacity-40"
                  >
                    {isSaving ? "Saving update..." : "Save update"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-base font-semibold text-black">Activity</div>
                  <div className="text-sm text-black/50">
                    {localSummaryMap[selectedLead.id]?.call_count || selectedLeadCalls.length} update
                    {(localSummaryMap[selectedLead.id]?.call_count || selectedLeadCalls.length) === 1 ? "" : "s"}
                  </div>
                </div>

                {loadingDetails ? (
                  <div className="text-sm text-black/55">Loading activity...</div>
                ) : selectedLeadCalls.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-black/10 bg-[#fafafa] p-4 text-sm text-black/55">
                    No updates yet for this lead.
                  </div>
                ) : (
                  <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                    {selectedLeadCalls.map((call) => (
                      <div key={call.id} className="rounded-xl border border-black/10 bg-[#fcfcfc] p-4">
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
            </div>
          )}
        </div>
      </div>
    </section>
  );
}