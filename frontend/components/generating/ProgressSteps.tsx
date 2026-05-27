'use client';
import { Check } from 'lucide-react';
import { ProgressStep } from '@/store/generationStore';

export function ProgressSteps({ steps, currentStep }: { steps: ProgressStep[]; currentStep: number }) {
  return (
    <div className="space-y-4 w-full max-w-sm">
      {steps.map((step) => {
        const isActive = step.step === currentStep;
        const isDone = step.completed;

        return (
          <div
            key={step.step}
            className={`flex items-center gap-4 transition-all duration-500 ${
              isDone || isActive ? 'opacity-100 translate-y-0' : 'opacity-40'
            }`}
          >
            {/* Icon */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
              isDone ? 'bg-green-500 text-white scale-100'
              : isActive ? 'bg-orange-500 text-white ring-4 ring-orange-100'
              : 'bg-gray-100 text-gray-400'
            }`}>
              {isDone ? (
                <Check size={15} strokeWidth={3} />
              ) : isActive ? (
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping block" />
              ) : (
                <span className="text-xs font-medium">{step.step}</span>
              )}
            </div>

            {/* Label + animated bar */}
            <div className="flex-1">
              <span className={`text-sm font-medium block ${
                isDone ? 'text-gray-400 line-through' : isActive ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {step.message}
              </span>
              {isActive && (
                <div className="mt-1.5 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-400 rounded-full animate-progress" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
