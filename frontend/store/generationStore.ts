import { create } from 'zustand';

export interface ProgressStep {
  step: number;
  message: string;
  completed: boolean;
}

const INITIAL_STEPS: ProgressStep[] = [
  { step: 1, message: 'Creating job', completed: false },
  { step: 2, message: 'Processing request', completed: false },
  { step: 3, message: 'Generating questions', completed: false },
  { step: 4, message: 'Structuring paper', completed: false },
  { step: 5, message: 'Finalizing', completed: false },
];

interface GenerationStore {
  steps: ProgressStep[];
  currentStep: number;
  failed: boolean;
  failMessage: string;
  resetGeneration: () => void;
  markStepComplete: (step: number) => void;
  setFailed: (message: string) => void;
}

export const useGenerationStore = create<GenerationStore>((set) => ({
  steps: INITIAL_STEPS,
  currentStep: 1,
  failed: false,
  failMessage: '',

  resetGeneration: () =>
    set({ steps: INITIAL_STEPS.map((s) => ({ ...s, completed: false })), currentStep: 1, failed: false, failMessage: '' }),

  markStepComplete: (step) =>
    set((state) => ({
      steps: state.steps.map((s) => (s.step <= step ? { ...s, completed: true } : s)),
      currentStep: step + 1,
    })),

  setFailed: (message) => set({ failed: true, failMessage: message }),
}));
