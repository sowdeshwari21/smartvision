import path from 'path';
import fs from 'fs';
import PdfDocument from '../model/PdfDocument.js';
import mongoose from 'mongoose';

export const uploadPDF = async (req, res) => {
  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  try {
    // Ensure the uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    console.log('File received:', req.file);
    console.log('File details:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size
    });

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection not ready');
    }

    const pdfDoc = new PdfDocument({
      name: req.body.name || req.file.originalname,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`
    });
    
    await pdfDoc.save();
    console.log('PDF document saved to database:', pdfDoc);

    res.json({ 
      message: 'PDF uploaded successfully',
      pdf: pdfDoc 
    });
  } catch (error) {
    console.error('Error in uploadPDF:', error);
    // Clean up the uploaded file if database save fails
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    
    // Check if it's a MongoDB connection error
    if (error.name === 'MongooseServerSelectionError') {
      return res.status(503).json({ 
        message: 'Database service temporarily unavailable. Please try again later.',
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      message: 'Error saving PDF details', 
      error: error.message 
    });
  }
};

export const getAllPDFs = async (req, res) => {
  try {
    const pdfs = await PdfDocument.find().sort({ uploadDate: -1 });
    res.json(pdfs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching PDFs', error });
  }
};

export const getPDFByName = async (req, res) => {
  try {
    const searchName = new RegExp(req.params.name, 'i'); // Case-insensitive search
    const pdf = await PdfDocument.findOne({ name: searchName });
    
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }
    
    res.json(pdf);
  } catch (error) {
    res.status(500).json({ message: 'Error finding PDF', error });
  }
};

export const summarizeText = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  console.log("Received summarization request for text of length:", text.length);

  try {
    if (text.length < 10) {
      return res.status(400).json({
        error: "Text too short to summarize",
        summary: text
      });
    }

    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
    console.log(`Text contains ${sentences.length} sentences`);

    if (sentences.length <= 3) {
      console.log("Text is already concise, returning original");
      return res.json({ summary: text });
    }

    const scoredSentences = sentences.map((sentence, index) => {
      const cleanSentence = sentence.trim().replace(/\s+/g, " ");
      const positionScore = (index === 0 || index === sentences.length - 1) ? 2 :
                            (index < 3) ? 1.5 : 1;
      const words = cleanSentence.split(/\s+/).length;
      const lengthScore = (words > 5 && words < 25) ? 1.5 : 
                          (words <= 5) ? 0.8 : 1;
      const importantWords = ["important", "significant", "key", "main", "crucial", "essential", 
                              "primary", "critical", "vital", "necessary", "fundamental"];
      const containsImportantWord = importantWords.some(word => 
        cleanSentence.toLowerCase().includes(word)
      );
      const importanceScore = containsImportantWord ? 1.7 : 1;

      const totalScore = positionScore * lengthScore * importanceScore;

      return { sentence: cleanSentence, score: totalScore, originalIndex: index };
    });

    const sortedSentences = [...scoredSentences].sort((a, b) => b.score - a.score);
    const summaryLength = Math.max(2, Math.min(Math.ceil(sentences.length * 0.3), 5));
    const topSentences = sortedSentences.slice(0, summaryLength);

    const orderedSummary = topSentences
      .sort((a, b) => a.originalIndex - b.originalIndex)
      .map(item => item.sentence)
      .join(" ");

    console.log("Summarization complete: Original", text.length, "chars →", orderedSummary.length, "chars");

    res.json({
      summary: orderedSummary,
      originalLength: text.length,
      summaryLength: orderedSummary.length,
      compressionRate: Math.round((1 - orderedSummary.length / text.length) * 100)
    });
  } catch (error) {
    console.error("Error during summarization:", error);

    try {
      const simpleSummary = text.split('.').slice(0, 3).join('.') + '.';
      console.log("Using basic fallback summarization");
      res.json({
        summary: simpleSummary,
        fallback: true
      });
    } catch (fallbackError) {
      console.error("Even fallback summarization failed:", fallbackError);
      res.json({
        summary: text,
        error: "Summarization failed, returning original text"
      });
    }
  }
};

export const deletePDF = async (req, res) => {
  try {
    const pdf = await PdfDocument.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    // Delete the file from the uploads directory
    const filePath = path.join(process.cwd(), 'uploads', pdf.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete the document from MongoDB
    await PdfDocument.findByIdAndDelete(req.params.id);
    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting PDF', error });
  }
};