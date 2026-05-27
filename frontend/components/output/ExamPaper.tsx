import { GeneratedPaper } from '@/types/paper';
import { QuestionSection } from './QuestionSection';

export function ExamPaper({ paper, showAnswers }: { paper: GeneratedPaper; showAnswers?: boolean }) {
  let questionIndex = 1;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-3xl mx-auto font-serif">
      {/* Header */}
      <div className="text-center border-b border-gray-300 pb-4 mb-6">
        <h1 className="text-lg font-bold text-gray-900">{paper.schoolName}</h1>
        <p className="text-sm text-gray-700 mt-1">Subject: {paper.subject}</p>
        <p className="text-sm text-gray-700">Class: {paper.class}</p>
        <div className="flex justify-between text-xs text-gray-600 mt-3">
          <span>Time Allowed: {paper.duration}</span>
          <span>Maximum Marks: {paper.totalMarks}</span>
        </div>
        <p className="text-xs text-gray-500 italic mt-2">All questions are compulsory unless stated otherwise.</p>
      </div>

      {/* Student Info */}
      {!showAnswers && (
        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
          <div>
            Name: <span className="border-b border-gray-400 inline-block w-24">&nbsp;</span>
          </div>
          <div>
            Roll Number: <span className="border-b border-gray-400 inline-block w-20">&nbsp;</span>
          </div>
          <div>
            Class: <span className="border-b border-gray-400 inline-block w-20">&nbsp;</span>
          </div>
        </div>
      )}

      {showAnswers && (
        <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 font-medium">
          Answer Key — For Teacher Use Only
        </div>
      )}

      {/* Sections */}
      {paper.sections.map((section, i) => {
        const el = (
          <QuestionSection key={i} section={section} startIndex={questionIndex} showAnswers={showAnswers} />
        );
        questionIndex += section.questions.length;
        return el;
      })}

      <p className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4 mt-4 italic">
        End of Question Paper
      </p>
    </div>
  );
}
