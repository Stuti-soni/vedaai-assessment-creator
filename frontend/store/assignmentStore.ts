import { create } from 'zustand';
import { Assignment } from '@/types/assignment';
import { api } from '@/services/api';

interface AssignmentStore {
  assignments: Assignment[];
  loading: boolean;
  fetchAssignments: () => Promise<void>;
  addAssignment: (a: Assignment) => void;
  updateAssignmentStatus: (id: string, status: Assignment['status']) => void;
  removeAssignment: (id: string) => void;
}

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  assignments: [],
  loading: false,

  fetchAssignments: async () => {
    set({ loading: true });
    try {
      const data = await api.listAssignments();
      set({ assignments: data });
    } finally {
      set({ loading: false });
    }
  },

  addAssignment: (assignment) =>
    set((state) => ({ assignments: [assignment, ...state.assignments] })),

  updateAssignmentStatus: (id, status) =>
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a._id === id ? { ...a, status } : a
      ),
    })),

  removeAssignment: (id) =>
    set((state) => ({ assignments: state.assignments.filter((a) => a._id !== id) })),
}));
