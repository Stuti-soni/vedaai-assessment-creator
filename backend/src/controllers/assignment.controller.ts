import { Request, Response } from 'express';
import { CreateAssignmentSchema } from '../lib/validators';
import * as AssignmentService from '../services/assignment.service';
import { extractTextFromBuffer } from '../services/file.service';
import { logger } from '../utils/logger';

export async function createAssignment(req: Request, res: Response) {
  let body = req.body;
  // When sent as multipart/form-data, questionTypes arrives as a JSON string
  if (typeof body.questionTypes === 'string') {
    try {
      body = { ...body, questionTypes: JSON.parse(body.questionTypes) };
    } catch {
      return res.status(400).json({ error: 'Invalid questionTypes format' });
    }
  }

  const parsed = CreateAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    let extractedText: string | undefined;
    const file = req.file;
    if (file) {
      extractedText = await extractTextFromBuffer(file.buffer, file.mimetype);
    }
    const assignment = await AssignmentService.createAssignment(parsed.data, extractedText);
    return res.status(201).json(assignment);
  } catch (err) {
    logger.error('createAssignment failed', { err });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listAssignments(_req: Request, res: Response) {
  try {
    const assignments = await AssignmentService.listAssignments();
    return res.json(assignments);
  } catch (err) {
    logger.error('listAssignments failed', { err });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAssignment(req: Request, res: Response) {
  try {
    const result = await AssignmentService.getAssignmentById(req.params['id'] as string);
    if (!result) return res.status(404).json({ error: 'Assignment not found' });
    return res.json(result);
  } catch (err) {
    logger.error('getAssignment failed', { err });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteAssignment(req: Request, res: Response) {
  try {
    const deleted = await AssignmentService.deleteAssignment(req.params['id'] as string);
    if (!deleted) return res.status(404).json({ error: 'Assignment not found' });
    return res.status(204).send();
  } catch (err) {
    logger.error('deleteAssignment failed', { err });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function regenerateAssignment(req: Request, res: Response) {
  try {
    const assignment = await AssignmentService.regenerateAssignment(req.params['id'] as string);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    return res.json(assignment);
  } catch (err) {
    logger.error('regenerateAssignment failed', { err });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
