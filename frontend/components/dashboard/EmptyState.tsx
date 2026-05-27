import Link from 'next/link';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-32 h-32 mb-6 relative">
        <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="2" />
            <path d="M20 32h24M32 20v24" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
            <circle cx="44" cy="20" r="8" fill="#fee2e2" />
            <path d="M41 20h6M44 17v6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">No assignments yet</h2>
      <p className="text-gray-500 text-sm max-w-sm mb-8">
        Create your first assignment to start collecting and grading student submissions. You can set
        up rubrics, define marking criteria, and let AI assist with grading.
      </p>
      <Link
        href="/assignments/new"
        className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors"
      >
        + Create Your First Assignment
      </Link>
    </div>
  );
}
