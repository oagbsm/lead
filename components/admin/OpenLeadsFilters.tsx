type Props = {
  search: string;
  statusFilter: string;
  outcomeFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onOutcomeChange: (value: string) => void;
  onToggleVisible: () => void;
};

export default function OpenLeadsFilters({
  search,
  statusFilter,
  outcomeFilter,
  onSearchChange,
  onStatusChange,
  onOutcomeChange,
  onToggleVisible,
}: Props) {
  return (
    <div className="border-b border-black/10 p-5">
      <div className="mb-3 text-lg font-semibold text-black">Open Leads</div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_180px_180px_auto]">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search business, contact, phone, email, profession, or location"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black/25"
        />

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="assigned">Assigned</option>
          <option value="called">Called</option>
          <option value="follow_up">Follow up</option>
          <option value="interested">Interested</option>
          <option value="not_interested">Not interested</option>
          <option value="bad_lead">Bad lead</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={outcomeFilter}
          onChange={(e) => onOutcomeChange(e.target.value)}
          className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
        >
          <option value="all">All outcomes</option>
          <option value="none">No calls yet</option>
          <option value="no_answer">No answer</option>
          <option value="busy">Busy</option>
          <option value="wrong_number">Wrong number</option>
          <option value="bad_lead">Bad lead</option>
          <option value="not_interested">Not interested</option>
          <option value="interested">Interested</option>
          <option value="callback">Callback</option>
          <option value="sent_info">Sent info</option>
          <option value="converted">Converted</option>
          <option value="closed">Closed</option>
        </select>

        <button
          onClick={onToggleVisible}
          className="rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm font-medium transition hover:bg-black/5"
        >
          Toggle visible
        </button>
      </div>
    </div>
  );
}
