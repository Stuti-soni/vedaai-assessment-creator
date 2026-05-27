'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { CreateAssignmentSchema, CreateAssignmentFormValues } from '@/lib/validators';
import { QuestionTypeRow } from '@/components/create/QuestionTypeRow';
import { UploadBox } from '@/components/create/UploadBox';
import { VoiceInput } from '@/components/create/VoiceInput';
import { api } from '@/services/api';
import { useAssignmentStore } from '@/store/assignmentStore';
import { toast } from '@/store/toastStore';

export default function NewAssignmentPage() {
  const router = useRouter();
  const addAssignment = useAssignmentStore((s) => s.addAssignment);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const methods = useForm<CreateAssignmentFormValues>({
    resolver: zodResolver(CreateAssignmentSchema),
    defaultValues: {
      subject: '',
      dueDate: '',
      additionalInfo: '',
      questionTypes: [{ type: '', count: 1, marks: 1 }],
    },
  });

  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: 'questionTypes' });

  const questionTypes = watch('questionTypes');
  const totalQuestions = questionTypes.reduce((s, qt) => s + (Number(qt.count) || 0), 0);
  const totalMarks = questionTypes.reduce((s, qt) => s + (Number(qt.count) || 0) * (Number(qt.marks) || 0), 0);

  async function onSubmit(data: CreateAssignmentFormValues) {
    try {
      const assignment = await api.createAssignment(data, uploadedFile);
      addAssignment(assignment);
      toast.success('Assignment created! Generating your paper...');
      router.push(`/assignments/${assignment._id}/generating`);
    } catch {
      toast.error('Failed to create assignment. Please try again.');
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Create Assignment</h1>
          <p className="text-sm text-gray-500">Set up a new assignment for your students</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="font-medium text-gray-900">Assignment Details</h2>
              <p className="text-xs text-gray-500">Basic information about your assignment</p>
            </div>

            <UploadBox file={uploadedFile} onChange={setUploadedFile} />
            <p className="text-xs text-gray-400 text-center -mt-2">Upload images of your preferred document/image</p>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Due Date</label>
              <input
                type="date"
                {...register('dueDate')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Subject</label>
              <input
                {...register('subject')}
                placeholder="e.g. Science, Mathematics"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
            </div>

            {/* Question Types */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">Question Type</label>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <QuestionTypeRow
                    key={field.id}
                    index={index}
                    onRemove={() => remove(index)}
                    canRemove={fields.length > 1}
                  />
                ))}
              </div>

              {errors.questionTypes?.root && (
                <p className="text-xs text-red-500 mt-1">{errors.questionTypes.root.message}</p>
              )}

              <button
                type="button"
                onClick={() => append({ type: '', count: 1, marks: 1 })}
                className="mt-3 flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                <Plus size={16} />
                Add Question Type
              </button>
            </div>

            {/* Totals */}
            <div className="flex justify-end gap-6 pt-2 border-t border-gray-100 text-sm text-gray-600">
              <span>Total Questions: <strong>{totalQuestions}</strong></span>
              <span>Total Marks: <strong>{totalMarks}</strong></span>
            </div>

            {/* Additional info */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Additional Information <span className="text-gray-400 font-normal">(For better output)</span>
              </label>
              <div className="relative">
                <textarea
                  {...register('additionalInfo')}
                  placeholder="e.g. Generate a question paper for a 3-hour exam duration..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
                <div className="absolute bottom-2 right-2">
                  <VoiceInput
                    onTranscript={(text) => {
                      const current = methods.getValues('additionalInfo') ?? '';
                      methods.setValue('additionalInfo', current ? `${current} ${text}` : text);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Previous
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Next'}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
