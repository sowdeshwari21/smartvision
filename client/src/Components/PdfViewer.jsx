import { useEffect, useState, useRef } from "react";

// Set up PDF.js worker
const pdfjsLib = window["pdfjs-dist/build/pdf"];
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

export default function PdfViewer({ selectedPdf }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [scale, setScale] = useState(1.5);

  useEffect(() => {
    if (selectedPdf) {
      console.log("Loading PDF:", selectedPdf);
      loadPdf(selectedPdf);
    }
  }, [selectedPdf]);

  const loadPdf = async (pdf) => {
    try {
      setIsLoading(true);
      console.log("Fetching PDF from path:", `http://localhost:5000${pdf.path}`);
      
      // Fetch the PDF file from the server
      const response = await fetch(`http://localhost:5000${pdf.path}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const pdfData = new Uint8Array(await blob.arrayBuffer());
      
      console.log("PDF data loaded, creating document...");
      
      // Load the PDF using PDF.js
      const loadedPdf = await pdfjsLib.getDocument(pdfData).promise;
      setPdfDoc(loadedPdf);
      setNumPages(loadedPdf.numPages);
      setCurrentPage(1);
      
      console.log("PDF loaded successfully, rendering first page...");
      
      // Render the first page once PDF is loaded
      renderPage(loadedPdf, 1);
    } catch (error) {
      console.error("Error loading PDF:", error);
      showNotification("Error loading PDF file: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPage = async (pdf, pageNumber) => {
    if (!pdf) return;
    
    try {
      setIsLoading(true);
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.getElementById("pdf-view-canvas");
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
    } catch (error) {
      console.error("Error rendering page:", error);
      setIsLoading(false);
      showNotification("Error rendering page. Please try again.");
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
      renderPage(pdfDoc, currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      renderPage(pdfDoc, currentPage - 1);
    }
  };

  const handlePageChange = (e) => {
    const pageNumber = Number.parseInt(e.target.value);
    if (pageNumber >= 1 && pageNumber <= numPages) {
      setCurrentPage(pageNumber);
      renderPage(pdfDoc, pageNumber);
    }
  };

  const handleZoomIn = () => {
    setScale((prevScale) => prevScale + 0.2);
    renderPage(pdfDoc, currentPage);
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(0.5, prevScale - 0.2));
    renderPage(pdfDoc, currentPage);
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

  if (!selectedPdf) {
    return <div className="p-6 text-center text-gray-500">Please select a PDF to view</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 my-4">
      <h2 className="text-xl font-bold mb-4">{selectedPdf.name}</h2>
      
      <div className="pdf-controls bg-gray-50 rounded-xl p-4 mb-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
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

      <div className="pdf-display bg-white rounded-xl shadow-md p-6 min-h-[500px] flex justify-center items-center relative overflow-auto">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
        <canvas
          id="pdf-view-canvas"
          className="max-w-full h-auto"
          style={{ minHeight: "500px" }}
        ></canvas>
      </div>
    </div>
  );
}