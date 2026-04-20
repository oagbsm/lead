

type SummaryCard = {
  label: string;
  value: number;
};

type AdminSummaryCardsProps = {
  cards: SummaryCard[];
};

export default function AdminSummaryCards({ cards }: AdminSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="text-sm text-black/55">{card.label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">{card.value}</div>
        </div>
      ))}
    </div>
  );
}