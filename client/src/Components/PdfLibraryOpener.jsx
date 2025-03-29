import { useState, useEffect, useRef } from 'react';

export default function PdfLibraryOpener({ onPdfOpen }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
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
          onPdfOpen({ command: 'open', name: searchName });
          return;
        }

        // Handle other commands
        switch (transcript) {
          case 'read':
          case 'read current page':
            onPdfOpen({ command: 'readCurrentPage' });
            break;
          case 'pause':
            onPdfOpen({ command: 'pause' });
            break;
          case 'stop':
          case 'stop reading':
            onPdfOpen({ command: 'stop' });
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
  }, [onPdfOpen]);

  const handleVoiceOpenPdf = async (name) => {
    try {
      // Remove file extension if present
      const searchName = name.replace(/\.pdf$/i, '').trim();
      
      const response = await fetch(`http://localhost:5000/api/pdf/find/${searchName}`);
      if (!response.ok) {
        throw new Error('PDF not found');
      }
      
      const pdfData = await response.json();
      const pdfResponse = await fetch(`http://localhost:5000${pdfData.path}`);
      const pdfBlob = await pdfResponse.blob();
      
      // Create a File object from the blob
      const file = new File([pdfBlob], pdfData.name, { type: 'application/pdf' });
      
      // Call the parent component's handler with the file
      onPdfOpen({ file, name: pdfData.name });
      showNotification(`Opening PDF: ${pdfData.name}`);
    } catch (error) {
      console.error('Error loading PDF:', error);
      showNotification('Error loading PDF file');
    }
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

  return (
    <div className="flex items-center gap-4">
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

      {/* Voice command popup */}
      {isListening && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 animate-fadeIn">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-4 relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-purple-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="absolute inset-0 rounded-full border-4 border-purple-500 opacity-75 animate-ping"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Listening...
              </h3>
              <p className="text-gray-600 text-center mb-4">
                Say "Open [PDF name]" to open a PDF
              </p>
              <button
                onClick={() => setIsListening(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 