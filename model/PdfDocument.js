import mongoose from 'mongoose';

const pdfDocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true // For faster searching by name
  },
  filename: String,
  path: String,
  uploadDate: {
    type: Date,
    default: Date.now
  },
  userId: String // If you implement user authentication later
});

export default mongoose.model('PdfDocument', pdfDocumentSchema);