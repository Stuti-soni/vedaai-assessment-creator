import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  text: string;
  answer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  type: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IGeneratedPaper extends Document {
  assignmentId: mongoose.Types.ObjectId;
  schoolName: string;
  subject: string;
  class: string;
  duration: string;
  totalMarks: number;
  sections: ISection[];
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  answer: { type: String },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  marks: { type: Number, required: true },
  type: { type: String, required: true },
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: { type: [QuestionSchema], required: true },
});

const GeneratedPaperSchema = new Schema<IGeneratedPaper>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    schoolName: { type: String, required: true },
    subject: { type: String, required: true },
    class: { type: String, required: true },
    duration: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    sections: { type: [SectionSchema], required: true },
  },
  { timestamps: true }
);

export const GeneratedPaper = mongoose.model<IGeneratedPaper>('GeneratedPaper', GeneratedPaperSchema);
