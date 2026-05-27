import { z } from 'zod';

export const QuestionTypeSchema = z.object({
  type: z.string().min(1),
  count: z.number().int().min(1),
  marks: z.number().int().min(1),
});

export const CreateAssignmentSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  dueDate: z.string().refine((d) => new Date(d) > new Date(), {
    message: 'Due date must be in the future',
  }),
  additionalInfo: z.string().optional(),
  questionTypes: z.array(QuestionTypeSchema).min(1, 'At least one question type required'),
});

export const AIQuestionSchema = z.object({
  text: z.string().min(1),
  answer: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  marks: z.number().int().min(1),
  type: z.string().min(1),
});

export const AISectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().min(1),
  questions: z.array(AIQuestionSchema).min(1),
});

export const AIGeneratedPaperSchema = z.object({
  schoolName: z.string().min(1),
  subject: z.string().min(1),
  class: z.string().min(1),
  duration: z.string().min(1),
  totalMarks: z.number().int().min(1),
  sections: z.array(AISectionSchema).min(1),
});

export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;
export type AIGeneratedPaper = z.infer<typeof AIGeneratedPaperSchema>;
