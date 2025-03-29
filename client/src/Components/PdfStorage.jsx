import { useState, useEffect, useRef } from 'react';
import PdfLibraryOpener from './PdfLibraryOpener';
import PdfViewer from './PdfViewer';

export default function PdfStorage({ onSelectPdf }) {
  const [storedPDFs, setStoredPDFs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const [viewerPdf, setViewerPdf] = useState(null);

  useEffect(() => {
    fetchStoredPDFs();

    // Initialize Speech Recognition
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        setIsListening(false);
        const transcript = event.results[0][0].transcript.toLowerCase();
        console.log("Recognized:", transcript);

        // Handle PDF opening commands
        const openMatch = transcript.match(/open (.*?)(?:\s|$)/);
        if (openMatch) {
          const searchName = openMatch[1].trim();
          handleVoiceOpenPdf(searchName);
          return;
        }

        // Handle other commands
        switch (transcript) {
          case 'read':
          case 'read current page':
            onSelectPdf({ readCurrentPage: true });
            break;
          case 'pause':
            onSelectPdf({ pause: true });
            break;
          case 'stop':
          case 'stop reading':
            onSelectPdf({ stop: true });
            break;
          default:
            showNotification("Command not recognized");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const fetchStoredPDFs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5000/api/pdf/all');
      if (!response.ok) {
        throw new Error('Failed to fetch PDFs');
      }
      const data = await response.json();
      setStoredPDFs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      setError('Failed to load PDFs. Please try again later.');
      setStoredPDFs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchStoredPDFs();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:5000/api/pdf/find/${searchQuery}`);
      if (!response.ok) {
        throw new Error('PDF not found');
      }
      const data = await response.json();
      setStoredPDFs(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error('Error searching PDF:', error);
      setError('No PDFs found matching your search.');
      setStoredPDFs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (pdfId) => {
    if (!window.confirm('Are you sure you want to delete this PDF?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/pdf/delete/${pdfId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setStoredPDFs(prevPDFs => prevPDFs.filter(pdf => pdf._id !== pdfId));
      } else {
        throw new Error('Failed to delete PDF');
      }
    } catch (error) {
      console.error('Error deleting PDF:', error);
      setError('Failed to delete PDF. Please try again.');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("File size too large. Maximum size is 10MB.");
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('name', file.name);

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5000/api/pdf/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Database service temporarily unavailable. Please try again later.');
        }
        throw new Error(data.message || 'Failed to upload PDF');
      }

      fetchStoredPDFs(); // Refresh the list
      setError(null);
    } catch (error) {
      console.error('Error uploading PDF:', error);
      setError(error.message || 'Failed to upload PDF. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handlePdfOpen = (pdf) => {
    // Only set the local viewerPdf state to display in the embedded viewer
    // Don't call onSelectPdf here to avoid redirecting to the audio section
    setViewerPdf(pdf);
    
    // Scroll to the viewer component after it's rendered
    setTimeout(() => {
      const viewerElement = document.getElementById("pdf-viewer-section");
      if (viewerElement) {
        viewerElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleVoiceOpenPdf = (name) => {
    // Remove file extension if present
    const searchName = name.replace(/\.pdf$/i, '').trim();
    
    // Find PDF by name (case-insensitive)
    const pdf = storedPDFs.find(p => 
      p.name.toLowerCase().replace(/\.pdf$/i, '').includes(searchName.toLowerCase())
    );

    if (pdf) {
      // Set the PDF to be viewed in the embedded viewer
      setViewerPdf(pdf);
      showNotification(`Opening PDF: ${pdf.name}`);
      
      // Scroll to the viewer component
      setTimeout(() => {
        const viewerElement = document.getElementById("pdf-viewer-section");
        if (viewerElement) {
          viewerElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      showNotification("PDF not found. Try saying the exact name of the PDF.");
    }
  };

  const handleVoiceReadPage = (pageNumber) => {
    // This will be handled by the parent component
    onSelectPdf({ readPage: pageNumber });
    showNotification(`Reading page ${pageNumber}`);
  };

  const handleVoiceReadCurrentPage = () => {
    onSelectPdf({ readCurrentPage: true });
    showNotification("Reading current page");
  };

  const handleVoicePause = () => {
    onSelectPdf({ pause: true });
    showNotification("Paused reading");
  };

  const handleVoiceStop = () => {
    onSelectPdf({ stop: true });
    showNotification("Stopped reading");
  };

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
      showNotification("Listening for voice commands...");
    }
  };

  const showNotification = (message) => {
    const notification = document.createElement("div");
    notification.className = "fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out z-50";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("translate-y-0", "opacity-100");
      notification.classList.remove("translate-y-10", "opacity-0");
    }, 10);

    setTimeout(() => {
      notification.classList.add("translate-y-10", "opacity-0");
      notification.classList.remove("translate-y-0", "opacity-100");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Your PDF Library</h2>
          <div className="flex gap-4">
            <button
              onClick={startListening}
              className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isListening 
                  ? "bg-purple-500 text-white animate-pulse" 
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
              {isListening ? "Listening..." : "Voice Command"}
            </button>
            <button
              onClick={triggerFileInput}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Upload PDF
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PDFs by name..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="text-center py-4 text-red-600 bg-red-50 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!error && storedPDFs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No PDFs found. Upload some PDFs to get started!</p>
          <button
            onClick={triggerFileInput}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Upload Your First PDF
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.isArray(storedPDFs) && storedPDFs.map((pdf) => (
            <div
              key={pdf._id}
              className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-800 truncate">{pdf.name}</h3>
                <button
                  onClick={() => handleDelete(pdf._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Uploaded: {new Date(pdf.uploadDate).toLocaleDateString()}
              </p>
              <button
                onClick={() => handlePdfOpen(pdf)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Open PDF
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add PdfViewer component */}
      {viewerPdf && (
        <div id="pdf-viewer-section" className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">PDF Viewer</h2>
            <button 
              onClick={() => setViewerPdf(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <PdfViewer selectedPdf={viewerPdf} />
        </div>
      )}
    </div>
  );
}