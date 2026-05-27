import { Router } from 'express';
import multer from 'multer';
import * as AssignmentController from '../controllers/assignment.controller';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const router = Router();

router.post('/', upload.single('file'), AssignmentController.createAssignment);
router.get('/', AssignmentController.listAssignments);
router.get('/:id', AssignmentController.getAssignment);
router.delete('/:id', AssignmentController.deleteAssignment);
router.post('/:id/regenerate', AssignmentController.regenerateAssignment);

export { router as assignmentRoutes };
