export interface Question {
  text: string;
  answer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  type: string;
}

export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface GeneratedPaper {
  _id: string;
  assignmentId: string;
  schoolName: string;
  subject: string;
  class: string;
  duration: string;
  totalMarks: number;
  sections: Section[];
  createdAt: string;
}
