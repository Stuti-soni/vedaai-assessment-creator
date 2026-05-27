export interface QuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  dueDate: string;
  additionalInfo?: string;
  questionTypes: QuestionType[];
  totalQuestions: number;
  totalMarks: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStep?: number;
  generatedPaperId?: string;
  createdAt: string;
}
