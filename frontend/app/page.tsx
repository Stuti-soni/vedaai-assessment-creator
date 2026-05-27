'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Bell, Search, SlidersHorizontal, Check } from 'lucide-react';
import { useAssignmentStore } from '@/store/assignmentStore';
import { AssignmentCard } from '@/components/dashboard/AssignmentCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Assignment } from '@/types/assignment';

const STATUS_OPTIONS: { label: string; value: Assignment['status'] | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Completed', value: 'completed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
];

export default function DashboardPage() {
  const { assignments, loading, fetchAssignments } = useAssignmentStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<Assignment['status'] | 'all'>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = assignments
    .filter((a) => filterStatus === 'all' || a.status === filterStatus)
    .filter((a) => a.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-gray-900 font-medium text-base">Assignment</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-gray-500 hover:text-gray-700">
            <Bell size={20} />
          </button>
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-medium text-orange-700">
            JD
          </div>
        </div>
      </div>

      {/* Title + Create */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900 leading-tight">Assignments</h1>
            <p className="text-xs text-gray-400">Manage and create assignments for your classes</p>
          </div>
        </div>
        <Link
          href="/assignments/new"
          className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          + Create Assignment
        </Link>
      </div>

      {/* Filter + Search */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <SlidersHorizontal size={14} />
            {filterStatus === 'all' ? 'Filter by' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
          </button>
          {filterOpen && (
            <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setFilterStatus(opt.value); setFilterOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {opt.label}
                  {filterStatus === opt.value && <Check size={14} className="text-orange-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Assignment"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No assignments match your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((a) => (
            <AssignmentCard key={a._id} assignment={a} />
          ))}
        </div>
      )}
    </div>
  );
}
