import { Worker } from 'bullmq';
import { getBullMQConnection } from '../lib/redis';
import { Assignment } from '../models/Assignment.model';
import { GeneratedPaper } from '../models/GeneratedPaper.model';
import { buildGenerationPrompt } from '../services/prompt.service';
import { generatePaperWithAI } from '../services/ai.service';
import { getIO } from '../websocket/socket.server';
import { logger } from '../utils/logger';
import { GenerationJobData } from '../queues/generation.queue';

async function setStep(assignmentId: string, step: number, message: string) {
  await Assignment.findByIdAndUpdate(assignmentId, { currentStep: step });
  getIO().to(assignmentId).emit('generation-progress', { step, message });
}

export function startGenerationWorker() {
  const worker = new Worker<GenerationJobData>(
    'generation',
    async (job) => {
      const { assignmentId } = job.data;

      try {
        await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing', currentStep: 2 });
        getIO().to(assignmentId).emit('generation-progress', { step: 2, message: 'Processing request' });

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

        await setStep(assignmentId, 3, 'Generating questions');
        const prompt = buildGenerationPrompt(assignment, assignment.extractedText);
        const paperData = await generatePaperWithAI(prompt);

        await setStep(assignmentId, 4, 'Structuring paper');
        const generatedPaper = await GeneratedPaper.create({
          ...paperData,
          assignmentId: assignment._id,
        });

        await setStep(assignmentId, 5, 'Finalizing');
        await Assignment.findByIdAndUpdate(assignmentId, {
          status: 'completed',
          currentStep: 5,
          generatedPaperId: generatedPaper._id,
        });

        getIO().to(assignmentId).emit('assignment-completed', { assignmentId, paperId: generatedPaper._id });
        logger.info(`Generation completed for assignment ${assignmentId}`);
      } catch (err) {
        logger.error(`Generation failed for assignment ${assignmentId}`, { err });
        await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
        getIO().to(assignmentId).emit('assignment-failed', {
          assignmentId,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
        throw err;
      }
    },
    { connection: getBullMQConnection(), concurrency: 3 }
  );

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed`, { err: err.message });
  });

  logger.info('Generation worker started');
  return worker;
}
