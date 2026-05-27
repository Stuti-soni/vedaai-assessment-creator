'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RotateCcw, KeyRound } from 'lucide-react';
import { ExamPaper } from '@/components/output/ExamPaper';
import { api } from '@/services/api';
import { GeneratedPaper } from '@/types/paper';
import { Assignment } from '@/types/assignment';
import dynamic from 'next/dynamic';

const PDFExport = dynamic(() => import('@/components/output/PDFExport').then((m) => m.PDFExport), {
  ssr: false,
  loading: () => (
    <button className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-50">
      Download as PDF
    </button>
  ),
});

export default function AssignmentOutputPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    api.getAssignment(params.id).then(({ assignment, generatedPaper }) => {
      setAssignment(assignment);
      setPaper(generatedPaper);
      setLoading(false);
    });
  }, [params.id]);

  async function handleRegenerate() {
    setRegenerating(true);
    await api.regenerateAssignment(params.id);
    router.push(`/assignments/${params.id}/generating`);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-full mb-2" />
            <div className="h-3 bg-gray-100 rounded w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">No question paper found for this assignment.</p>
        <button
          onClick={handleRegenerate}
          className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
        >
          Generate Now
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* AI chat bubble */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs">V</span>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            Certainly! Here are your customised Question Papers for your <strong>{assignment?.subject}</strong> class.
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <PDFExport paper={paper} />
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              <RotateCcw size={14} />
              {regenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
            <button
              onClick={() => setShowAnswers((v) => !v)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showAnswers
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <KeyRound size={14} />
              {showAnswers ? 'Hide Answer Key' : 'Show Answer Key'}
            </button>
          </div>
        </div>
      </div>

      <ExamPaper paper={paper} showAnswers={showAnswers} />
    </div>
  );
}
