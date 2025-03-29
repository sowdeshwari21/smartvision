import { Router } from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import { uploadPDF, getAllPDFs, getPDFByName, summarizeText, deletePDF } from '../controllers/pdfController.js';

const router = Router();

router.post('/upload', upload.single('pdf'), uploadPDF);
router.get('/all', getAllPDFs);
router.get('/find/:name', getPDFByName);
router.post('/summarize', summarizeText);
router.delete('/delete/:id', deletePDF);

export default router;
