"use client";

import { useEffect, useState, useRef } from "react";

// Set up PDF.js worker
const pdfjsLib = window["pdfjs-dist/build/pdf"];
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

export default function PdfReader({ isPlaying, setIsPlaying }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechRef = useRef(null);
  const recognitionRef = useRef(null);
  const [scale, setScale] = useState(1.5);
  const fileInputRef = useRef(null);
  const [summaryText, setSummaryText] = useState(""); // Add state for summary text
  const [storedPDFs, setStoredPDFs] = useState([]);
  const [pdfName, setPdfName] = useState('');
  const [selectedPdf, setSelectedPdf] = useState(null);

  useEffect(() => {
    // Initialize Speech Recognition
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
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
          loadStoredPDF(searchName);
          return;
        }

        // Handle page navigation commands
        const pageMatch = transcript.match(/read page (\d+)/);
        if (pageMatch) {
          const pageNumber = Number.parseInt(pageMatch[1]);
          if (pageNumber >= 1 && pageNumber <= numPages) {
            setCurrentPage(pageNumber);
            renderPage(pageNumber);
          } else {
            showNotification("Invalid page number");
          }
          return;
        }

        // Handle other commands
        switch (transcript) {
          case 'stop reading':
          case 'stop':
            stopSpeech();
            break;
          case 'pause':
            pauseSpeech();
            break;
          case 'resume':
            resumeSpeech();
            break;
          case 'next page':
            goToNextPage();
            break;
          case 'previous page':
            goToPrevPage();
            break;
          case 'read':
            renderPage(currentPage);
            break;
          case 'read current page':
            renderPage(currentPage);
            break;
          case 'read next page':
            goToNextPage();
            break;
          case 'read previous page':
            goToPrevPage();
            break;
          default:
            showNotification("Command not recognized");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Cleanup speech synthesis on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [numPages]);

  useEffect(() => {
    if (isPlaying && pdfDoc) {
      renderPage(currentPage);
    } else if (!isPlaying) {
      stopSpeech();
    }
  }, [isPlaying, currentPage, pdfDoc]);

  useEffect(() => {
    if (selectedPdf && selectedPdf.readPage) {
      const pageNumber = selectedPdf.readPage;
      if (pageNumber >= 1 && pageNumber <= numPages) {
        setCurrentPage(pageNumber);
        renderPage(pageNumber);
      }
      // Clear the readPage flag
      setSelectedPdf(prev => ({ ...prev, readPage: undefined }));
    }
  }, [selectedPdf?.readPage]);

  useEffect(() => {
    if (selectedPdf && selectedPdf.readCurrentPage) {
      renderPage(currentPage);
      // Clear the readCurrentPage flag
      setSelectedPdf(prev => ({ ...prev, readCurrentPage: undefined }));
    }
  }, [selectedPdf?.readCurrentPage]);

  useEffect(() => {
    if (selectedPdf) {
      if (selectedPdf.openInViewer) {
        // Load the PDF file and show it in the viewer
        loadPdfFile(selectedPdf.file);
        setPdfName(selectedPdf.name);
        // Clear the openInViewer flag
        setSelectedPdf(prev => ({ ...prev, openInViewer: undefined }));
      } else if (selectedPdf.command) {
        switch (selectedPdf.command) {
          case 'open':
            loadStoredPDF(selectedPdf.name);
            break;
          case 'readCurrentPage':
            renderPage(currentPage);
            break;
          case 'pause':
            pauseSpeech();
            break;
          case 'stop':
            stopSpeech();
            break;
        }
        // Clear the command after handling
        setSelectedPdf(prev => ({ ...prev, command: undefined }));
      } else if (selectedPdf.file) {
        loadPdfFile(selectedPdf.file);
        setPdfName(selectedPdf.name);
      }
    }
  }, [selectedPdf]);

  const showNotification = (message) => {
    // Create and show notification
    const notification = document.createElement("div");
    notification.className =
      "fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out z-50";
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.add("translate-y-0", "opacity-100");
      notification.classList.remove("translate-y-10", "opacity-0");
    }, 10);

    // Remove after delay
    setTimeout(() => {
      notification.classList.add("translate-y-10", "opacity-0");
      notification.classList.remove("translate-y-0", "opacity-100");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      showNotification("Please upload a PDF file");
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('name', file.name);

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/pdf/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload PDF');
      }

      const data = await response.json();
      showNotification('PDF uploaded successfully');
      
      // Load the uploaded PDF
      loadPdfFile(file);
      setPdfName(data.pdf.name);
      
      // Refresh the stored PDFs list
      fetchStoredPDFs();
    } catch (error) {
      console.error('Error uploading PDF:', error);
      showNotification('Error uploading PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      showNotification("Please upload a PDF file");
      return;
    }

    loadPdfFile(file);
  };

  const loadPdfFile = (file) => {
    setIsLoading(true);
    const fileReader = new FileReader();
    fileReader.onload = function () {
      const typedArray = new Uint8Array(this.result);
      pdfjsLib
        .getDocument(typedArray)
        .promise.then((pdf) => {
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setCurrentPage(1);
          renderPage(1);
          setIsLoading(false);
          // Scroll to the viewer section
          const viewerElement = document.getElementById("pdf-viewer");
          if (viewerElement) {
            viewerElement.scrollIntoView({ behavior: "smooth" });
          }
        })
        .catch((error) => {
          console.error("Error loading PDF:", error);
          showNotification("Error loading PDF. Please try another file.");
          setIsLoading(false);
        });
    };
    fileReader.readAsArrayBuffer(file);
  };

  const renderPage = async (pageNumber) => {
    if (!pdfDoc) return;
    try {
      setIsLoading(true);
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.getElementById("pdf-canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Clear the canvas before rendering
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Render the page
      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      setIsLoading(false);
      // Only extract text after successful render
      await extractText(page);
    } catch (error) {
      console.error("Error rendering page:", error);
      setIsLoading(false);
      showNotification("Error rendering page. Please try again.");
    }
  };

  // Trigger initial render when the PDF is loaded
  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale]); // Add scale as a dependency to re-render on zoom changes

  const extractText = async (page) => {
    try {
      const textContent = await page.getTextContent();
      const extractedText = textContent.items.map((item) => item.str).join(" ");
      speakText(extractedText);
    } catch (error) {
      console.error("Error extracting text:", error);
      showNotification("Error extracting text from page.");
    }
  };

  const speakText = (text) => {
    stopSpeech();
    speechRef.current = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speechRef.current);
    setIsSpeaking(true);

    speechRef.current.onend = () => {
      setIsSpeaking(false);
    };
  };

  const pauseSpeech = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsSpeaking(false);
    }
  };

  const resumeSpeech = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsSpeaking(true);
    }
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handlePageChange = (e) => {
    const pageNumber = Number.parseInt(e.target.value);
    if (pageNumber >= 1 && pageNumber <= numPages) {
      setCurrentPage(pageNumber);
      renderPage(pageNumber);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
      renderPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      renderPage(currentPage - 1);
    }
  };

  const handleZoomIn = () => {
    setScale((prevScale) => prevScale + 0.2);
    renderPage(currentPage);
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(0.5, prevScale - 0.2));
    renderPage(currentPage);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const summarizePage = async () => {
    if (!pdfDoc) return;

    try {
      setIsLoading(true);
      // Get only the current page
      const page = await pdfDoc.getPage(currentPage);
      const textContent = await page.getTextContent();
      const extractedText = textContent.items.map((item) => item.str).join(" ");

      const response = await fetch("http://localhost:5000/api/pdf/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      });

      const data = await response.json();
      if (response.ok) {
        setSummaryText(`Page ${currentPage} Summary: ${data.summary}`); // Include page number in summary
        speakText(data.summary); // Read the summary aloud
      } else {
        showNotification(data.error || "Failed to summarize the page.");
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error summarizing page:", error);
      showNotification("Error summarizing the page.");
      setIsLoading(false);
    }
  };

  // Add an effect to clear the summary when page changes
  useEffect(() => {
    // Clear summary when changing pages
    setSummaryText("");
  }, [currentPage]);

  // Fetch stored PDFs on component mount
  useEffect(() => {
    fetchStoredPDFs();
  }, []);

  const fetchStoredPDFs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/pdf/all');
      const data = await response.json();
      setStoredPDFs(data);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      showNotification('Error loading stored PDFs');
    }
  };

  // Update the loadStoredPDF function to handle voice commands better
  const loadStoredPDF = async (name) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:5000/api/pdf/find/${name}`);
      if (!response.ok) {
        throw new Error('PDF not found');
      }
      
      const pdfData = await response.json();
      const pdfResponse = await fetch(`http://localhost:5000${pdfData.path}`);
      const pdfBlob = await pdfResponse.blob();
      
      loadPdfFile(new File([pdfBlob], pdfData.name, { type: 'application/pdf' }));
      setPdfName(pdfData.name);
      showNotification(`Loaded PDF: ${pdfData.name}`);
    } catch (error) {
      console.error('Error loading stored PDF:', error);
      showNotification('Error loading PDF');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="pdf-viewer"
      className="bg-gradient-to-br from-white to-gray-100 rounded-2xl shadow-2xl p-8 transition-all duration-300 relative overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500 opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500 opacity-10 rounded-full blur-3xl"></div>

      {!pdfDoc ? (
        <div
          className={`file-upload-section mb-8 transition-all duration-300 ${
            isDragging ? "scale-105" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div
            className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 
            ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-blue-300 hover:border-blue-500 hover:bg-blue-50/50"
            }`}
          >
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="h-12 w-12 text-blue-500"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-gray-600">
                <h3 className="text-xl font-semibold mb-2">Upload your PDF</h3>
                <p className="text-gray-500 mb-4">
                  Drag and drop your file here or click to browse
                </p>
                <button
                  onClick={triggerFileInput}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-1"
                >
                  Select PDF File
                </button>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500">PDF up to 10MB</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="pdf-controls bg-white rounded-xl p-5 shadow-md backdrop-blur-sm backdrop-filter">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="page-controls flex items-center space-x-2">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage <= 1}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                    currentPage <= 1
                      ? "bg-gray-200 text-gray-400"
                      : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                  <input
                    type="number"
                    id="pageNumber"
                    min="1"
                    max={numPages}
                    value={currentPage}
                    onChange={handlePageChange}
                    className="w-12 bg-transparent text-center focus:outline-none"
                  />
                  <span className="text-gray-600 mx-2">/</span>
                  <span className="text-gray-600">{numPages}</span>
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage >= numPages}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                    currentPage >= numPages
                      ? "bg-gray-200 text-gray-400"
                      : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="zoom-controls flex items-center space-x-3">
                <button
                  onClick={handleZoomOut}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <span className="text-gray-700 font-medium w-20 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="pdf-display bg-white rounded-xl shadow-lg p-6 min-h-[500px] flex justify-center items-center relative overflow-auto">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                <div className="loader">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              </div>
            )}
            <canvas
              id="pdf-canvas"
              className="max-w-full h-auto"
              style={{ minHeight: "500px" }}
            ></canvas>
          </div>

          <div className="speech-controls grid grid-cols-2 sm:grid-cols-6 gap-3">
            <button
              onClick={() => renderPage(currentPage)}
              className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2
                ${
                  isSpeaking
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:from-blue-600 hover:to-blue-700"
                }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Read Page</span>
            </button>
            <button
              onClick={pauseSpeech}
              disabled={!isSpeaking}
              className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2
                ${
                  !isSpeaking
                    ? "bg-gray-100 text-gray-400"
                    : "bg-gray-700 text-white hover:bg-gray-800"
                }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Pause</span>
            </button>
            <button
              onClick={resumeSpeech}
              disabled={!window.speechSynthesis.paused}
              className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2
                ${
                  !window.speechSynthesis.paused
                    ? "bg-gray-100 text-gray-400"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Resume</span>
            </button>
            <button
              onClick={stopSpeech}
              disabled={!isSpeaking && !window.speechSynthesis.paused}
              className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2
                ${
                  !isSpeaking && !window.speechSynthesis.paused
                    ? "bg-gray-100 text-gray-400"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Stop</span>
            </button>
            <button
              onClick={startListening}
              className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2
                ${
                  isListening
                    ? "bg-purple-100 text-purple-700 animate-pulse"
                    : "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg hover:from-purple-600 hover:to-purple-700"
                }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Voice Command</span>
            </button>
            <button
              onClick={summarizePage}
              className="px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-yellow-500 text-white hover:bg-yellow-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Summarize</span>
            </button>
          </div>

          <div className="summary-display bg-gray-50 rounded-xl p-6 shadow-md mt-6">
            {summaryText && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Summary:
                </h3>
                <p className="text-gray-600">{summaryText}</p>
              </div>
            )}
          </div>

          {/* Add stored PDFs list */}
          {storedPDFs.length > 0 && (
            <div className="mt-4 p-4 bg-white rounded-xl shadow-md">
              <h3 className="text-lg font-semibold mb-2">Your PDFs</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {storedPDFs.map((pdf) => (
                  <button
                    key={pdf._id}
                    onClick={() => loadStoredPDF(pdf.name)}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-left"
                  >
                    <p className="font-medium truncate">{pdf.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(pdf.uploadDate).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
                Say "Read page X" to navigate to a specific page
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

      {/* Add custom styles for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes ping {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          75%,
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
