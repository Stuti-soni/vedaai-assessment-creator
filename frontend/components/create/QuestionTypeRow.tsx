'use client';
import { X } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { CreateAssignmentFormValues } from '@/lib/validators';

const QUESTION_TYPE_OPTIONS = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Questions',
  'Diagrams/Graph-Based Questions',
  'Numerical Problems',
  'Fill in the Blanks',
  'True/False',
];

interface Props {
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

export function QuestionTypeRow({ index, onRemove, canRemove }: Props) {
  const { register, watch, setValue, formState: { errors } } = useFormContext<CreateAssignmentFormValues>();

  const count = Number(watch(`questionTypes.${index}.count`)) || 1;
  const marks = Number(watch(`questionTypes.${index}.marks`)) || 1;

  const typeError = errors.questionTypes?.[index]?.type?.message;
  const countError = errors.questionTypes?.[index]?.count?.message;
  const marksError = errors.questionTypes?.[index]?.marks?.message;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <select
          {...register(`questionTypes.${index}.type`)}
          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">Select type</option>
          {QUESTION_TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        {canRemove && (
          <button type="button" onClick={onRemove} className="p-1.5 text-gray-400 hover:text-red-500 shrink-0">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 pl-1">
        {/* No. of Questions stepper */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-28">No. of Questions</span>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setValue(`questionTypes.${index}.count`, Math.max(1, count - 1))}
              className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 text-sm font-medium"
            >
              –
            </button>
            <span className="w-8 text-center text-sm py-1.5 border-x border-gray-200">{count}</span>
            <button
              type="button"
              onClick={() => setValue(`questionTypes.${index}.count`, count + 1)}
              className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 text-sm font-medium"
            >
              +
            </button>
          </div>
        </div>

        {/* Marks stepper */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-10">Marks</span>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setValue(`questionTypes.${index}.marks`, Math.max(1, marks - 1))}
              className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 text-sm font-medium"
            >
              –
            </button>
            <span className="w-8 text-center text-sm py-1.5 border-x border-gray-200">{marks}</span>
            <button
              type="button"
              onClick={() => setValue(`questionTypes.${index}.marks`, marks + 1)}
              className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 text-sm font-medium"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {(typeError || countError || marksError) && (
        <p className="text-xs text-red-500 pl-1">{typeError || countError || marksError}</p>
      )}
    </div>
  );
}
