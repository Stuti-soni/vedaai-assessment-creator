import { Queue } from 'bullmq';
import { getBullMQConnection } from '../lib/redis';

export interface GenerationJobData {
  assignmentId: string;
}

export const generationQueue = new Queue<GenerationJobData>('generation', {
  connection: getBullMQConnection(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
