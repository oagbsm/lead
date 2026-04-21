"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const TEST_REP_ID = "11111111-1111-1111-1111-111111111111";

type LeadWithRelations = {
  id?: string;
  sequence_number?: number;
  business_name?: string;
  phone?: string;
  website?: string;
  email?: string;
  source?: string;
  professions?: {
    name?: string;
  } | null;
  locations?: {
    city?: string;
    country?: string;
  } | null;
};

type QueueLeadRow = {
  id: string;
  lead_id?: string;
  leads: LeadWithRelations | null;
};

export default function Dashboard() {
  const [lead, setLead] = useState<QueueLeadRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLead();
  }, []);

  async function fetchLead() {
    const { data, error } = await supabase
      .from("rep_daily_queue")
      .select(`
        *,
        leads (
          id,
          sequence_number,
          business_name,
          phone,
          email,
          website,
          source,
          professions:profession_id (
            name
          ),
          locations:location_id (
            city,
            country
          )
        )
      `)
      .eq("rep_id", TEST_REP_ID)
      .is("completed_at", null)
      .order("queue_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching lead:", error);
      setLead(null);
      return;
    }

    setLead(data ?? null);
  }

  async function handleComplete(outcome: string, note: string) {
    if (!lead || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const { data: queueRow, error: queueCheckError } = await supabase
        .from("rep_daily_queue")
        .select("id, completed_at")
        .eq("id", lead.id)
        .eq("rep_id", TEST_REP_ID)
        .maybeSingle();

      if (queueCheckError) {
        console.error("Error checking queue row:", queueCheckError);
        return;
      }

      if (!queueRow || queueRow.completed_at) {
        await fetchLead();
        return;
      }

      const { error: insertError } = await supabase.from("lead_calls").insert({
        lead_id: lead.lead_id,
        rep_id: TEST_REP_ID,
        outcome,
        note,
      });

      if (insertError) {
        console.error("Error inserting lead call:", insertError);
        return;
      }

      const { error: updateError } = await supabase
        .from("rep_daily_queue")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", lead.id)
        .eq("rep_id", TEST_REP_ID)
        .is("completed_at", null);

      if (updateError) {
        console.error("Error completing queue row:", updateError);
        return;
      }

      setLead(null);
      await fetchLead();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!lead || !lead.leads) {
    return (
      <div className="min-h-screen bg-[#071225] text-white">
        <div className="flex min-h-screen">
          <aside className="hidden w-[260px] flex-col border-r border-white/10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(180deg,#071225_0%,#030712_100%)] p-6 lg:flex">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold text-white">
                O
              </div>
              <div>
                <p className="text-lg font-semibold">Lead Dialer</p>
                <p className="text-sm text-white/50">Dialer</p>
              </div>
            </div>

            <div className="mt-10 rounded-2xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20">
              Dialer
            </div>

            <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-white/60">Queue status</p>
              <p className="mt-2 text-2xl font-semibold">0 leads</p>
              <p className="mt-1 text-sm text-white/50">
                No leads available right now.
              </p>
            </div>
          </aside>

          <main className="flex min-h-screen flex-1 items-center justify-center p-6 lg:p-10">
            <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-white/5 p-6 text-center shadow-2xl backdrop-blur">
              <div className="rounded-3xl border border-white/10 bg-white px-8 py-12 text-slate-900">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl font-semibold text-slate-700">
                  O
                </div>
                <h1 className="mt-5 text-3xl font-semibold tracking-tight">
                  No leads available
                </h1>
                <p className="mt-3 text-base text-slate-500">
                  Your queue is currently empty. Once a lead is assigned, it
                  will appear here.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const currentLead = lead.leads;

  return (
    <div className="min-h-screen bg-[#071225] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] flex-col border-r border-white/10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(180deg,#071225_0%,#030712_100%)] p-6 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold text-white">
              O
            </div>
            <div>
              <p className="text-lg font-semibold">Lead Dialer</p>
              <p className="text-sm text-white/50">Dialer</p>
            </div>
          </div>

          <nav className="mt-10 space-y-3">
            <div className="rounded-2xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20">
              Dialer
            </div>
          </nav>

          <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/60">Current queue</p>
            <p className="mt-2 text-2xl font-semibold">
              Lead #{currentLead.sequence_number ?? "-"}
            </p>
            <p className="mt-1 text-sm text-white/50">Ready for action</p>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-[1280px] rounded-[28px] border border-black/5 bg-[#f5f7fb] p-4 shadow-2xl lg:p-6">
            <LeadCard
              lead={currentLead}
              onComplete={handleComplete}
              isSubmitting={isSubmitting}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

type LeadCardProps = {
  lead: LeadWithRelations;
  onComplete: (outcome: string, note: string) => void;
  isSubmitting: boolean;
};

function LeadCard({ lead, onComplete, isSubmitting }: LeadCardProps) {
  const [note, setNote] = useState("");
  const [scriptType, setScriptType] = useState<"no_website" | "poor_website">(
    "no_website"
  );

  const outcomes = [
    "no_answer",
    "not_interested",
    "bad_lead",
    "interested",
    "callback",
  ];

  const websiteHref = useMemo(() => {
    if (!lead.website) return undefined;
    return lead.website.startsWith("http")
      ? lead.website
      : `https://${lead.website}`;
  }, [lead.website]);

  const emailHref = useMemo(() => {
    if (!lead.email) return undefined;
    return `mailto:${lead.email}`;
  }, [lead.email]);

  const phoneHref = useMemo(() => {
    if (!lead.phone) return undefined;
    return `tel:${lead.phone}`;
  }, [lead.phone]);

  const location =
    [lead.locations?.city, lead.locations?.country]
      .filter(Boolean)
      .join(", ") || "Unknown location";

  const profession = lead.professions?.name || "Unknown profession";
  const contactName = lead.business_name || "there";
  const sourceLabel = lead.source || "Unknown source";

  const selectedScript = useMemo(() => {
    if (scriptType === "poor_website") {
      return {
        title: "Poor Website Script",
        sections: [
          {
            heading: "Opening",
            lines: [
              `Hi, is this ${contactName}?`,
              `It’s Sarah from Omino Digital.`,
              `I came across your website — it looks alright, but I noticed a few things that could be improved, especially on mobile.`,
              `Just wanted to ask — is your website actually bringing in new customers right now?`,
            ],
          },
          {
            heading: "If they say ‘Not really’",
            lines: [
              `Yeah, that’s exactly what I see with a lot of businesses.`,
              `Usually it’s not about having a website — it’s about whether it actually converts visitors into enquiries.`,
              `Have you ever looked into improving it?`,
            ],
          },
          {
            heading: "If they say ‘Yes, we have one’ defensively",
            lines: [
              `Yeah of course, most businesses do.`,
              `The real question is whether it’s actually working for you or just sitting there.`,
              `Are you getting consistent enquiries from it?`,
            ],
          },
          {
            heading: "If they show interest",
            lines: [
              `What I can do is put together a quick redesign mockup so you can see what a higher-converting version could look like.`,
              `No pressure at all.`,
              `Would you be open to that?`,
            ],
          },
          {
            heading: "If they say ‘Send email’",
            lines: [
              `Yeah no problem.`,
              `Just so I send something relevant — are you more interested in improving what you have, or potentially rebuilding it properly?`,
            ],
          },
          {
            heading: "Close",
            lines: [
              `Perfect, I’ll send something tailored over.`,
              `What’s the best email for you?`,
            ],
          },
        ],
      };
    }

    return {
      title: "No Website Script",
      sections: [
        {
          heading: "Opening",
          lines: [
            `Hi, is this ${contactName}?`,
            `Hi, it’s Sarah calling from Omino Digital.`,
            `I was just having a quick look and noticed you don’t currently have a proper website.`,
            `Just wanted to ask — is that something you’ve been planning to set up or just not a priority right now?`,
          ],
        },
        {
          heading: "If they say ‘Not a priority’",
          lines: [
            `Yeah that’s fair.`,
            `Out of curiosity, how are most of your customers finding you at the moment?`,
          ],
        },
        {
          heading: "If they say ‘Referrals / word of mouth’",
          lines: [
            `That makes sense, a lot of businesses rely on that.`,
            `The only issue is a lot of people still check online before choosing — even if they’re referred.`,
            `Have you ever had someone ask if you have a website?`,
          ],
        },
        {
          heading: "If they show interest",
          lines: [
            `What I can do is put together a quick mockup for your business so you can actually see what it could look like.`,
            `No obligation at all.`,
            `Would you be open to that?`,
          ],
        },
        {
          heading: "If they say ‘Send email’",
          lines: [
            `Yeah of course, I can send something over.`,
            `Just so I don’t send something generic — are you looking to get something simple set up, or something more designed to bring in customers?`,
          ],
        },
        {
          heading: "Close",
          lines: [
            `Perfect, I’ll put something together and send it over.`,
            `What’s the best email to reach you on?`,
          ],
        },
      ],
    };
  }, [scriptType, contactName]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
        <div className="rounded-[20px] border border-slate-200 bg-white p-4 lg:p-5">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                      {lead.business_name || "Unknown business"}
                    </h1>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                      New Lead
                    </span>
                  </div>

                  <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                      Source
                    </span>
                    <span className="font-semibold text-amber-950">{sourceLabel}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    {lead.phone && phoneHref && (
                      <a
                        href={phoneHref}
                        className="font-medium text-[#2563eb] hover:underline"
                      >
                        {lead.phone}
                      </a>
                    )}

                    {lead.website && websiteHref && (
                      <a
                        href={websiteHref}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-[#2563eb] hover:underline"
                      >
                        {lead.website}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-400">
                  ☆
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-400">
                  •••
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                <div className="text-sm text-slate-500">Profession</div>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {profession}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                <div className="text-sm text-slate-500">Location</div>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {location}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm text-slate-500">Email</div>
                <p className="mt-1 break-all text-base font-medium text-slate-900">
                  {lead.email || "No email"}
                </p>
              </div>

              {emailHref ? (
                <a
                  href={emailHref}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-[#2563eb] transition hover:bg-slate-50"
                >
                  Email
                </a>
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-lg font-semibold text-slate-900">
              Quick Actions
            </div>

            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              {outcomes.map((outcome) => {
                const label = outcome.replaceAll("_", " ");
                const styles: Record<string, string> = {
                  interested:
                    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                  not_interested:
                    "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
                  bad_lead:
                    "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
                  callback:
                    "border-blue-200 bg-blue-50 text-[#2563eb] hover:bg-blue-100",
                  no_answer:
                    "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
                };

                return (
                  <button
                    key={outcome}
                    className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold capitalize transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[outcome]}`}
                    onClick={() => onComplete(outcome, note)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-lg font-semibold text-slate-900">Add Notes</div>
            <textarea
              className="mt-3 min-h-[88px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition focus:border-[#2563eb] focus:bg-white"
              placeholder="Add notes about this call..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </section>

      <aside className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center gap-6 text-sm font-medium">
            <div className="border-b-2 border-[#2563eb] pb-3 text-[#2563eb]">
              Script
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-lg font-semibold text-slate-900">
                Cold Call Script
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Pick the script type and follow the conversation flow.
              </p>
            </div>

            <select
              value={scriptType}
              onChange={(e) =>
                setScriptType(e.target.value as "no_website" | "poor_website")
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#2563eb] focus:bg-white"
            >
              <option value="no_website">No website</option>
              <option value="poor_website">Poor website</option>
            </select>
          </div>
        </div>

        <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-lg font-semibold text-slate-900">
            {selectedScript.title}
          </div>

          <div className="mt-4 space-y-4">
            {selectedScript.sections.map((section) => (
              <div
                key={section.heading}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {section.heading}
                </div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                  {section.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}