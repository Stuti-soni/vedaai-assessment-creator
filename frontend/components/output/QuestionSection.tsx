import { Section } from '@/types/paper';

export function QuestionSection({ section, startIndex, showAnswers }: { section: Section; startIndex: number; showAnswers?: boolean }) {
  return (
    <div className="mb-8">
      <div className="mb-3">
        <h3 className="font-bold text-gray-900 text-base">{section.title}</h3>
        <p className="text-sm text-gray-600 italic">{section.instruction}</p>
      </div>
      <ol className="space-y-4" start={startIndex}>
        {section.questions.map((q, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-sm font-medium text-gray-700 shrink-0 w-6">{startIndex + i}.</span>
            <div className="flex-1">
              <p className="text-sm text-gray-800 leading-relaxed">{q.text}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-gray-400">[{q.marks} mark{q.marks > 1 ? 's' : ''}]</span>
              </div>
              {showAnswers && q.answer && (
                <div className="mt-2 pl-3 border-l-2 border-green-400">
                  <p className="text-xs text-green-700 font-medium">Answer: <span className="font-normal">{q.answer}</span></p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
