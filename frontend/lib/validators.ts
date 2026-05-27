import { z } from 'zod';

export const QuestionTypeSchema = z.object({
  type: z.string().min(1, 'Question type is required'),
  count: z.coerce.number().int().min(1, 'Min 1 question'),
  marks: z.coerce.number().int().min(1, 'Min 1 mark'),
});

export const CreateAssignmentSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  dueDate: z.string().refine((d) => new Date(d) > new Date(), {
    message: 'Due date must be in the future',
  }),
  additionalInfo: z.string().optional(),
  questionTypes: z.array(QuestionTypeSchema).min(1, 'Add at least one question type'),
});

export type CreateAssignmentFormValues = z.infer<typeof CreateAssignmentSchema>;
