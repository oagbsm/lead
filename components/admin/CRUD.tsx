

"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profession = {
  id: string;
  name: string;
  is_active?: boolean;
};

type Location = {
  id: string;
  country: string;
  city?: string | null;
  is_active?: boolean;
};

type Lead = {
  id: string;
  business_name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  source?: string | null;
  status?: string | null;
  profession_id?: string | null;
  location_id?: string | null;
};

type TabKey = "professions" | "locations" | "leads";

const leadStatuses = [
  "new",
  "assigned",
  "called",
  "follow_up",
  "interested",
  "not_interested",
  "bad_lead",
  "closed",
];

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/10 p-5">
        <h2 className="text-lg font-semibold text-black">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-black/55">{subtitle}</p> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function CRUD() {
  const [activeTab, setActiveTab] = useState<TabKey>("professions");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [professions, setProfessions] = useState<Profession[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const [professionForm, setProfessionForm] = useState({ name: "" });
const [locationForm, setLocationForm] = useState({
  country: "",
  city: "",
});
  const [leadForm, setLeadForm] = useState({
    business_name: "",
    contact_name: "",
    phone: "",
    email: "",
    website: "",
    source: "",
    status: "new",
    profession_id: "",
    location_id: "",
  });

  const [editingProfessionId, setEditingProfessionId] = useState<string | null>(null);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [profRes, locRes, leadRes] = await Promise.all([
        supabase.from("professions").select("id, name, is_active").order("name", { ascending: true }),
        supabase
          .from("locations")
.select("id, country, city, is_active")
.order("country", { ascending: true })
.order("city", { ascending: true }),
        supabase
          .from("leads")
          .select("id, business_name, contact_name, phone, email, website, source, status, profession_id, location_id")
          .order("created_at", { ascending: false }),
      ]);

      if (profRes.error) console.error("Error loading professions:", profRes.error);
      if (locRes.error) console.error("Error loading locations:", locRes.error);
      if (leadRes.error) console.error("Error loading leads:", leadRes.error);

      setProfessions((profRes.data as Profession[]) ?? []);
      setLocations((locRes.data as Location[]) ?? []);
      setLeads((leadRes.data as Lead[]) ?? []);
    } finally {
      setLoading(false);
    }
  }

  const filteredProfessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return professions.filter((item) => !q || item.name.toLowerCase().includes(q));
  }, [professions, search]);

  const filteredLocations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return locations.filter((item) => {
const haystack = [item.country, item.city].filter(Boolean).join(" ").toLowerCase();      return !q || haystack.includes(q);
    });
  }, [locations, search]);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((item) => {
      const professionName = professions.find((p) => p.id === item.profession_id)?.name || "";
      const locationLabel = formatLocationLabel(locations.find((l) => l.id === item.location_id));
      const haystack = [
        item.business_name,
        item.contact_name,
        item.phone,
        item.email,
        item.website,
        item.source,
        item.status,
        professionName,
        locationLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return !q || haystack.includes(q);
    });
  }, [leads, professions, locations, search]);

  function formatLocationLabel(location?: Location) {
    if (!location) return "-";
return [location.city, location.country].filter(Boolean).join(", ");  }

  function startEditProfession(item: Profession) {
    setEditingProfessionId(item.id);
    setProfessionForm({ name: item.name });
    setActiveTab("professions");
  }

  function startEditLocation(item: Location) {
    setEditingLocationId(item.id);
setLocationForm({ country: "", city: "" });
    setActiveTab("locations");
  }

  function startEditLead(item: Lead) {
    setEditingLeadId(item.id);
    setLeadForm({
      business_name: item.business_name || "",
      contact_name: item.contact_name || "",
      phone: item.phone || "",
      email: item.email || "",
      website: item.website || "",
      source: item.source || "",
      status: item.status || "new",
      profession_id: item.profession_id || "",
      location_id: item.location_id || "",
    });
    setActiveTab("leads");
  }

  function resetProfessionForm() {
    setEditingProfessionId(null);
    setProfessionForm({ name: "" });
  }

  function resetLocationForm() {
    setEditingLocationId(null);
    setLocationForm({ country: "", city: "" });
  }

  function resetLeadForm() {
    setEditingLeadId(null);
    setLeadForm({
      business_name: "",
      contact_name: "",
      phone: "",
      email: "",
      website: "",
      source: "",
      status: "new",
      profession_id: "",
      location_id: "",
    });
  }

  async function saveProfession() {
    if (!professionForm.name.trim() || saving) return;
    setSaving(true);
    try {
      if (editingProfessionId) {
        const { error } = await supabase
          .from("professions")
          .update({ name: professionForm.name.trim() })
          .eq("id", editingProfessionId);
        if (error) {
          console.error("Error updating profession:", error);
          return;
        }
      } else {
        const { error } = await supabase.from("professions").insert({ name: professionForm.name.trim() });
        if (error) {
          console.error("Error creating profession:", error);
          return;
        }
      }
      resetProfessionForm();
      await loadAll();
    } finally {
      setSaving(false);
    }
  }

  async function saveLocation() {
    if (!locationForm.country.trim() || saving) return;
    setSaving(true);
    try {
const payload = {
  country: locationForm.country.trim(),
  city: locationForm.city.trim() || null,
};

      if (editingLocationId) {
        const { error } = await supabase.from("locations").update(payload).eq("id", editingLocationId);
        if (error) {
          console.error("Error updating location:", error);
          return;
        }
      } else {
        const { error } = await supabase.from("locations").insert(payload);
        if (error) {
          console.error("Error creating location:", error);
          return;
        }
      }
      resetLocationForm();
      await loadAll();
    } finally {
      setSaving(false);
    }
  }

  async function saveLead() {
    if (!leadForm.business_name.trim() || saving) return;
    setSaving(true);
    try {
      const payload = {
        business_name: leadForm.business_name.trim(),
        contact_name: leadForm.contact_name.trim() || null,
        phone: leadForm.phone.trim() || null,
        email: leadForm.email.trim() || null,
        website: leadForm.website.trim() || null,
        source: leadForm.source.trim() || null,
        status: leadForm.status,
        profession_id: leadForm.profession_id || null,
        location_id: leadForm.location_id || null,
      };

      if (editingLeadId) {
        const { error } = await supabase.from("leads").update(payload).eq("id", editingLeadId);
        if (error) {
          console.error("Error updating lead:", error);
          return;
        }
      } else {
        const { error } = await supabase.from("leads").insert(payload);
        if (error) {
          console.error("Error creating lead:", error);
          return;
        }
      }
      resetLeadForm();
      await loadAll();
    } finally {
      setSaving(false);
    }
  }

  async function deleteProfession(id: string) {
    if (saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("professions").delete().eq("id", id);
      if (error) {
        console.error("Error deleting profession:", error);
        return;
      }
      if (editingProfessionId === id) resetProfessionForm();
      await loadAll();
    } finally {
      setSaving(false);
    }
  }

  async function deleteLocation(id: string) {
    if (saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("locations").delete().eq("id", id);
      if (error) {
        console.error("Error deleting location:", error);
        return;
      }
      if (editingLocationId === id) resetLocationForm();
      await loadAll();
    } finally {
      setSaving(false);
    }
  }

  async function deleteLead(id: string) {
    if (saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) {
        console.error("Error deleting lead:", error);
        return;
      }
      if (editingLeadId === id) resetLeadForm();
      await loadAll();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black">Simple CRUD Manager</h1>
            <p className="mt-1 text-sm text-black/55">
              Manage professions, locations, and leads from one place.
            </p>
          </div>
          <div className="w-full max-w-sm">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search current tab"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black/25"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "professions", label: "Professions" },
            { key: "locations", label: "Locations" },
            { key: "leads", label: "Leads" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-black text-white"
                  : "bg-transparent text-black/65 hover:bg-black/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/55 shadow-sm">
          Loading...
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        {activeTab === "professions" ? (
          <>
            <SectionCard
              title={editingProfessionId ? "Edit profession" : "Add profession"}
              subtitle="Keep profession names short and clear."
            >
              <div className="space-y-3">
                <input
                  value={professionForm.name}
                  onChange={(e) => setProfessionForm({ name: e.target.value })}
                  placeholder="e.g. Accountant"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveProfession}
                    disabled={saving || !professionForm.name.trim()}
                    className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {saving ? "Saving..." : editingProfessionId ? "Update" : "Create"}
                  </button>
                  <button
                    onClick={resetProfessionForm}
                    className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Profession list"
              subtitle={`${filteredProfessions.length} item${filteredProfessions.length === 1 ? "" : "s"}`}
            >
              <div className="space-y-3">
                {filteredProfessions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-black/10 bg-[#fafafa] p-4 text-sm text-black/55">
                    No professions found.
                  </div>
                ) : (
                  filteredProfessions.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-[#fcfcfc] p-4"
                    >
                      <div className="font-medium text-black">{item.name}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditProfession(item)}
                          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProfession(item.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </>
        ) : null}

        {activeTab === "locations" ? (
          <>
            <SectionCard
              title={editingLocationId ? "Edit location" : "Add location"}
              subtitle="Country is required. State and city are optional."
            >
              <div className="space-y-3">
                <input
                  value={locationForm.country}
                  onChange={(e) => setLocationForm((current) => ({ ...current, country: e.target.value }))}
                  placeholder="Country"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                />

                <input
                  value={locationForm.city}
                  onChange={(e) => setLocationForm((current) => ({ ...current, city: e.target.value }))}
                  placeholder="City"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveLocation}
                    disabled={saving || !locationForm.country.trim()}
                    className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {saving ? "Saving..." : editingLocationId ? "Update" : "Create"}
                  </button>
                  <button
                    onClick={resetLocationForm}
                    className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Location list"
              subtitle={`${filteredLocations.length} item${filteredLocations.length === 1 ? "" : "s"}`}
            >
              <div className="space-y-3">
                {filteredLocations.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-black/10 bg-[#fafafa] p-4 text-sm text-black/55">
                    No locations found.
                  </div>
                ) : (
                  filteredLocations.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-[#fcfcfc] p-4"
                    >
                      <div>
                        <div className="font-medium text-black">{formatLocationLabel(item)}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditLocation(item)}
                          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteLocation(item.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </>
        ) : null}

        {activeTab === "leads" ? (
          <>
            <SectionCard
              title={editingLeadId ? "Edit lead" : "Add lead"}
              subtitle="Create or update one lead at a time."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={leadForm.business_name}
                  onChange={(e) => setLeadForm((current) => ({ ...current, business_name: e.target.value }))}
                  placeholder="Business name"
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none md:col-span-2"
                />
                <input
                  value={leadForm.contact_name}
                  onChange={(e) => setLeadForm((current) => ({ ...current, contact_name: e.target.value }))}
                  placeholder="Contact name"
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                />
                <input
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm((current) => ({ ...current, phone: e.target.value }))}
                  placeholder="Phone"
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                />
                <input
                  value={leadForm.email}
                  onChange={(e) => setLeadForm((current) => ({ ...current, email: e.target.value }))}
                  placeholder="Email"
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                />
                <input
                  value={leadForm.website}
                  onChange={(e) => setLeadForm((current) => ({ ...current, website: e.target.value }))}
                  placeholder="Website"
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                />
                <textarea
                  value={leadForm.source}
                  onChange={(e) => setLeadForm((current) => ({ ...current, source: e.target.value }))}
                  placeholder="Reason for calling e.g. no website, bad website, poor mobile experience, slow site"
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none md:col-span-2 min-h-[110px]"
                />
                <select
                  value={leadForm.status}
                  onChange={(e) => setLeadForm((current) => ({ ...current, status: e.target.value }))}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                >
                  {leadStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <select
                  value={leadForm.profession_id}
                  onChange={(e) => setLeadForm((current) => ({ ...current, profession_id: e.target.value }))}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="">No profession</option>
                  {professions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <select
                  value={leadForm.location_id}
                  onChange={(e) => setLeadForm((current) => ({ ...current, location_id: e.target.value }))}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="">No location</option>
                  {locations.map((item) => (
                    <option key={item.id} value={item.id}>
                      {formatLocationLabel(item)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={saveLead}
                  disabled={saving || !leadForm.business_name.trim()}
                  className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
                >
                  {saving ? "Saving..." : editingLeadId ? "Update" : "Create"}
                </button>
                <button
                  onClick={resetLeadForm}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black"
                >
                  Clear
                </button>
              </div>
            </SectionCard>

            <SectionCard
              title="Lead list"
              subtitle={`${filteredLeads.length} item${filteredLeads.length === 1 ? "" : "s"}`}
            >
              <div className="space-y-3">
                {filteredLeads.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-black/10 bg-[#fafafa] p-4 text-sm text-black/55">
                    No leads found.
                  </div>
                ) : (
                  filteredLeads.map((item) => {
                    const professionName = professions.find((p) => p.id === item.profession_id)?.name || "No profession";
                    const locationLabel = formatLocationLabel(locations.find((l) => l.id === item.location_id));

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-black/10 bg-[#fcfcfc] p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-1">
                            <div className="font-medium text-black">{item.business_name}</div>
                            <div className="text-sm text-black/60">
                              {item.contact_name || "No contact"} • {item.phone || "No phone"}
                            </div>
                            <div className="text-sm text-black/60">
                              {item.email || "No email"} • {item.website || "No website"}
                            </div>
                            <div className="text-sm text-black/50">
                              {professionName} • {locationLabel} • {item.status || "new"}
                            </div>
                            {item.source ? (
                              <div className="text-sm text-black/60">
                                Reason: {item.source}
                              </div>
                            ) : null}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditLead(item)}
                              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteLead(item.id)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </SectionCard>
          </>
        ) : null}
      </div>
    </div>
  );
}