'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, AlertTriangle } from 'lucide-react';
import { Assignment } from '@/types/assignment';
import { api } from '@/services/api';
import { useAssignmentStore } from '@/store/assignmentStore';
import { toast } from '@/store/toastStore';

const SUBJECT_COLORS: Record<string, string> = {
  mathematics: 'bg-green-100 text-green-700',
  math: 'bg-green-100 text-green-700',
  science: 'bg-blue-100 text-blue-700',
  physics: 'bg-blue-100 text-blue-700',
  chemistry: 'bg-cyan-100 text-cyan-700',
  biology: 'bg-emerald-100 text-emerald-700',
  english: 'bg-purple-100 text-purple-700',
  history: 'bg-amber-100 text-amber-700',
  geography: 'bg-teal-100 text-teal-700',
  computer: 'bg-indigo-100 text-indigo-700',
  economics: 'bg-rose-100 text-rose-700',
  default: 'bg-gray-100 text-gray-600',
};

function getSubjectColor(subject: string): string {
  const key = subject.toLowerCase().split(' ')[0];
  return SUBJECT_COLORS[key] ?? SUBJECT_COLORS.default;
}

function getDueDateWarning(dueDate: string): { label: string; className: string } | null {
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Overdue', className: 'bg-red-100 text-red-600' };
  if (diffDays === 0) return { label: 'Due today', className: 'bg-red-100 text-red-600' };
  if (diffDays <= 2) return { label: `Due in ${diffDays}d`, className: 'bg-orange-100 text-orange-600' };
  if (diffDays <= 7) return { label: `Due in ${diffDays}d`, className: 'bg-yellow-100 text-yellow-600' };
  return null;
}

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const router = useRouter();
  const removeAssignment = useAssignmentStore((s) => s.removeAssignment);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const assigned = new Date(assignment.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const due = new Date(assignment.dueDate).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const subjectColor = getSubjectColor(assignment.subject);
  const dueDateWarning = getDueDateWarning(assignment.dueDate);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleView() {
    setOpen(false);
    if (assignment.status === 'completed') {
      router.push(`/assignments/${assignment._id}`);
    } else {
      router.push(`/assignments/${assignment._id}/generating`);
    }
  }

  async function handleDelete() {
    setOpen(false);
    setDeleting(true);
    try {
      await api.deleteAssignment(assignment._id);
      removeAssignment(assignment._id);
      toast.success('Assignment deleted');
    } catch {
      setDeleting(false);
      toast.error('Failed to delete assignment');
    }
  }

  return (
    <div
      className={`bg-white rounded-xl p-5 flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-md transition-all border border-gray-100 cursor-pointer ${deleting ? 'opacity-40 pointer-events-none' : ''}`}
      onClick={handleView}
    >
      {/* Top row: title + menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base leading-snug truncate">{assignment.title}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${subjectColor}`}>
              {assignment.subject}
            </span>
            {dueDateWarning && (
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${dueDateWarning.className}`}>
                <AlertTriangle size={10} />
                {dueDateWarning.label}
              </span>
            )}
          </div>
        </div>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
          >
            <MoreVertical size={16} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleView(); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                View Assignment
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: dates */}
      <div className="mt-6 text-sm text-gray-500 space-y-1">
        <p><span className="font-medium text-gray-700">Assigned on :</span> {assigned}</p>
        <p><span className="font-medium text-gray-700">Due :</span> {due}</p>
      </div>
    </div>
  );
}
