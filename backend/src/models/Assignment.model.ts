import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  dueDate: Date;
  additionalInfo?: string;
  extractedText?: string;
  questionTypes: IQuestionType[];
  totalQuestions: number;
  totalMarks: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStep?: number;
  generatedPaperId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const QuestionTypeSchema = new Schema<IQuestionType>({
  type: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  marks: { type: Number, required: true, min: 1 },
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    dueDate: { type: Date, required: true },
    additionalInfo: { type: String },
    extractedText: { type: String },
    questionTypes: { type: [QuestionTypeSchema], required: true },
    totalQuestions: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    currentStep: { type: Number, default: 1 },
    generatedPaperId: { type: Schema.Types.ObjectId, ref: 'GeneratedPaper' },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
