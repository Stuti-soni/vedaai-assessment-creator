'use client';
import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProgressSteps } from '@/components/generating/ProgressSteps';
import { useGenerationStore } from '@/store/generationStore';
import { useAssignmentStore } from '@/store/assignmentStore';
import { connectSocket, disconnectSocket } from '@/services/socket';
import { api } from '@/services/api';

export default function GeneratingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { steps, currentStep, failed, failMessage, resetGeneration, markStepComplete, setFailed } =
    useGenerationStore();
  const updateAssignmentStatus = useAssignmentStore((s) => s.updateAssignmentStatus);
  const joined = useRef(false);

  function handleCompleted(id: string) {
    markStepComplete(5);
    updateAssignmentStatus(id, 'completed');
    setTimeout(() => router.push(`/assignments/${id}`), 800);
  }

  useEffect(() => {
    resetGeneration();
    markStepComplete(1);

    if (joined.current) return;
    joined.current = true;

    api.getAssignment(params.id).then(({ assignment }) => {
      if (assignment.status === 'completed') {
        [2, 3, 4, 5].forEach((s, i) => setTimeout(() => markStepComplete(s), i * 300));
        setTimeout(() => handleCompleted(params.id), 4 * 300 + 200);
        return;
      }
      if (assignment.status === 'failed') {
        updateAssignmentStatus(params.id, 'failed');
        setFailed('Generation failed. Please try again.');
        return;
      }
      const reached = assignment.currentStep ?? 1;
      for (let s = 2; s <= reached; s++) markStepComplete(s);
    });

    const socket = connectSocket();
    socket.emit('join-room', params.id);

    socket.on('generation-progress', ({ step }: { step: number }) => {
      markStepComplete(step);
    });

    socket.on('assignment-completed', () => handleCompleted(params.id));

    socket.on('assignment-failed', ({ message }: { message: string }) => {
      updateAssignmentStatus(params.id, 'failed');
      setFailed(message);
    });

    const poll = setInterval(async () => {
      const { assignment } = await api.getAssignment(params.id);
      const reached = assignment.currentStep ?? 1;
      for (let s = 2; s <= reached; s++) markStepComplete(s);

      if (assignment.status === 'completed') {
        clearInterval(poll);
        handleCompleted(params.id);
      } else if (assignment.status === 'failed') {
        clearInterval(poll);
        updateAssignmentStatus(params.id, 'failed');
        setFailed('Generation failed. Please try again.');
      }
    }, 4000);

    return () => {
      clearInterval(poll);
      socket.off('generation-progress');
      socket.off('assignment-completed');
      socket.off('assignment-failed');
      disconnectSocket();
    };
  }, [params.id]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center">
      {/* Pulsing AI orb */}
      <div className="relative w-20 h-20 flex items-center justify-center mb-8">
        {!failed && (
          <>
            <span className="absolute inset-0 rounded-full bg-orange-400 opacity-20 animate-ping" />
            <span className="absolute inset-2 rounded-full bg-orange-400 opacity-20 animate-ping [animation-delay:0.3s]" />
          </>
        )}
        <div className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${failed ? 'bg-red-500' : 'bg-orange-500'}`}>
          <span className="text-white font-bold text-lg">V</span>
        </div>
      </div>

      {!failed ? (
        <>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Generating your question paper...</h1>
          <p className="text-sm text-gray-500 mb-10">AI is crafting questions just for you ✨</p>
          <ProgressSteps steps={steps} currentStep={currentStep} />
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold text-red-600 mb-2">Generation failed</h1>
          <p className="text-sm text-gray-500 mb-6">{failMessage}</p>
          <button
            onClick={() => router.push(`/assignments/${params.id}/generating`)}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
          >
            Try Again
          </button>
        </>
      )}
    </div>
  );
}
