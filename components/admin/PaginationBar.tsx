

type Props = {
  page: number;
  totalPages: number;
  pageCount: number;
  totalCount: number;
  onPrevious: () => void;
  onNext: () => void;
};

export default function PaginationBar({
  page,
  totalPages,
  pageCount,
  totalCount,
  onPrevious,
  onNext,
}: Props) {
  return (
    <div className="flex flex-col gap-3 border-t border-black/10 p-5 text-sm md:flex-row md:items-center md:justify-between">
      <div className="text-black/55">
        Page {page} of {totalPages} • Showing {pageCount} of {totalCount} open leads
      </div>

      <div className="flex gap-2">
        <button
          onClick={onPrevious}
          disabled={page === 1}
          className="rounded-xl border border-black/10 bg-white px-4 py-2 transition hover:bg-black/5 disabled:opacity-40"
        >
          Previous
        </button>

        <button
          onClick={onNext}
          disabled={page === totalPages}
          className="rounded-xl border border-black/10 bg-white px-4 py-2 transition hover:bg-black/5 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}