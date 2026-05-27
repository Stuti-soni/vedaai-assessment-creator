import axios from 'axios';
import { Assignment } from '@/types/assignment';
import { GeneratedPaper } from '@/types/paper';
import { CreateAssignmentFormValues } from '@/lib/validators';

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});

export const api = {
  createAssignment: (data: CreateAssignmentFormValues, file?: File | null) => {
    const form = new FormData();
    form.append('subject', data.subject);
    form.append('dueDate', data.dueDate);
    if (data.additionalInfo) form.append('additionalInfo', data.additionalInfo);
    form.append('questionTypes', JSON.stringify(data.questionTypes));
    if (file) form.append('file', file);
    return client.post<Assignment>('/api/assignments', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  listAssignments: () =>
    client.get<Assignment[]>('/api/assignments').then((r) => r.data),

  getAssignment: (id: string) =>
    client
      .get<{ assignment: Assignment; generatedPaper: GeneratedPaper | null }>(`/api/assignments/${id}`)
      .then((r) => r.data),

  deleteAssignment: (id: string) =>
    client.delete(`/api/assignments/${id}`),

  regenerateAssignment: (id: string) =>
    client.post<Assignment>(`/api/assignments/${id}/regenerate`).then((r) => r.data),
};
