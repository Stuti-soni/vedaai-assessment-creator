import { Assignment } from '../models/Assignment.model';
import { GeneratedPaper } from '../models/GeneratedPaper.model';
import { generationQueue } from '../queues/generation.queue';
import { CreateAssignmentInput } from '../lib/validators';
import { redis } from '../lib/redis';

const CACHE_TTL = 30; // seconds

export async function createAssignment(input: CreateAssignmentInput, extractedText?: string) {
  const totalQuestions = input.questionTypes.reduce((sum, qt) => sum + qt.count, 0);
  const totalMarks = input.questionTypes.reduce((sum, qt) => sum + qt.count * qt.marks, 0);
  const title = `${input.subject} Assignment`;

  const assignment = await Assignment.create({
    title,
    subject: input.subject,
    dueDate: new Date(input.dueDate),
    additionalInfo: input.additionalInfo,
    extractedText,
    questionTypes: input.questionTypes,
    totalQuestions,
    totalMarks,
    status: 'pending',
  });

  await generationQueue.add('generate', { assignmentId: assignment._id.toString() });
  return assignment;
}

export async function listAssignments() {
  const cacheKey = 'assignments:list';
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const assignments = await Assignment.find({})
    .select('title subject dueDate status totalQuestions totalMarks createdAt')
    .sort({ createdAt: -1 })
    .lean();

  await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(assignments));
  return assignments;
}

export async function getAssignmentById(id: string) {
  const assignment = await Assignment.findById(id).lean();
  if (!assignment) return null;

  let generatedPaper = null;
  if (assignment.generatedPaperId) {
    generatedPaper = await GeneratedPaper.findById(assignment.generatedPaperId).lean();
  }

  return { assignment, generatedPaper };
}

export async function deleteAssignment(id: string) {
  const assignment = await Assignment.findByIdAndDelete(id);
  if (!assignment) return null;
  if (assignment.generatedPaperId) {
    await GeneratedPaper.findByIdAndDelete(assignment.generatedPaperId);
  }
  // Invalidate list cache
  await redis.del('assignments:list');
  return assignment;
}

export async function regenerateAssignment(id: string) {
  const assignment = await Assignment.findByIdAndUpdate(
    id,
    { status: 'pending', generatedPaperId: null },
    { new: true }
  );
  if (!assignment) return null;

  await generationQueue.add('generate' as never, { assignmentId: id });
  return assignment;
}
