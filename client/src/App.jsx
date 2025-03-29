"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./Components/Navbar";
import Hero from "./Components/Hero";
import PdfReader from "./Components/PdfReader";
import Footer from "./Components/Footer";
import VoiceControl from "./Components/VoiceControl";
import UserVoiceButton from "./Components/UserVoiceButton";
import "./App.css";

export default function App() {
  const [showConverter, setShowConverter] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [activeSection, setActiveSection] = useState("hero");

  const handleVoiceCommand = (command) => {
    switch (command.toLowerCase()) {
      case "play":
        setIsPlaying(true);
        break;
      case "pause":
        window.speechSynthesis.pause();
        break;
      case "stop":
        setIsPlaying(false);
        window.speechSynthesis.cancel();
        break;
      case "summarize":
        setShowSummary(true);
        break;
      case "translate to spanish":
        setTargetLanguage("es");
        break;
      case "translate to french":
        setTargetLanguage("fr");
        break;
      case "translate to english":
        setTargetLanguage("en");
        break;
      // Add more language commands as needed
    }
  };

  const handlePdfSelect = (pdf) => {
    // Handle voice commands and PDF opening
    if (typeof pdf === "object" && !pdf._id) {
      if (pdf.readPage) {
        // Handle read page command
        setSelectedPdf({ ...selectedPdf, readPage: pdf.readPage });
      } else if (pdf.readCurrentPage) {
        // Handle read current page command
        setSelectedPdf({ ...selectedPdf, readCurrentPage: true });
      } else if (pdf.pause) {
        // Handle pause command
        setIsPlaying(false);
      } else if (pdf.stop) {
        // Handle stop command
        setIsPlaying(false);
        window.speechSynthesis.cancel();
      } else if (pdf.file) {
        // Handle PDF file opening
        setSelectedPdf({ file: pdf.file, name: pdf.name });
        // Scroll to the converter section
        const converterElement = document.getElementById("converter");
        if (converterElement) {
          converterElement.scrollIntoView({ behavior: "smooth" });
        }
      }
      return;
    }

    // Handle PDF selection from library
    setSelectedPdf(pdf);
    // Scroll to the converter section
    const converterElement = document.getElementById("converter");
    if (converterElement) {
      converterElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      setShowConverter(window.location.hash === "#converter");

      // Smooth scroll to converter section if hash is #converter
      if (window.location.hash === "#converter") {
        setTimeout(() => {
          const converterElement = document.getElementById("converter");
          if (converterElement) {
            converterElement.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      }
    };

    const handleScroll = () => {
      setScrollPosition(window.scrollY);

      // Determine active section based on scroll position
      const sections = [
        "hero",
        "converter",
        "features",
        "how-it-works",
        "contact",
      ];

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    // Check initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("scroll", handleScroll);

    // Cleanup
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Animation variants for sections
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar activeSection={activeSection} />
      <main className="pt-16">
        <section id="hero">
          <Hero />
        </section>

        <motion.section
          id="converter"
          className="py-24 bg-gradient-to-b from-slate-50 to-slate-100"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <motion.div
                className="inline-block px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium mb-4"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                PDF to Audio
              </motion.div>
              <motion.h2
                className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                Convert Your PDF to Audio
              </motion.h2>
              <motion.p
                className="max-w-2xl mx-auto text-xl text-slate-600"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
              >
                Upload your PDF file and start listening to your documents with
                our advanced text-to-speech technology
              </motion.p>
            </div>
            <motion.div
              className="flex flex-wrap gap-4 justify-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
            >
              <VoiceControl
                isListening={isListening}
                setIsListening={setIsListening}
                onCommand={handleVoiceCommand}
              />
              <UserVoiceButton
                isListening={isListening}
                setIsListening={setIsListening}
              />
            </motion.div>
            <PdfReader
              showSummary={showSummary}
              targetLanguage={targetLanguage}
              isListening={isListening}
              setIsListening={setIsListening}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              selectedPdf={selectedPdf}
            />
          </div>
        </motion.section>

        <motion.section
          id="features"
          className="py-24 bg-white"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <motion.div
                className="inline-block px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium mb-4"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                Features
              </motion.div>
              <motion.h2
                className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                Everything You Need
              </motion.h2>
              <motion.p
                className="max-w-2xl mx-auto text-xl text-slate-600"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
              >
                Our PDF to Audio converter comes with all the features you need
                for a seamless experience
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  ),
                  title: "Fast Conversion",
                  description:
                    "Convert your PDFs to audio in seconds with our optimized processing engine",
                },
                {
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  ),
                  title: "Voice Commands",
                  description:
                    "Control your audio with natural voice commands for a hands-free experience",
                },
                {
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  ),
                  title: "Privacy First",
                  description:
                    "Your documents are processed securely and never stored on our servers",
                },
                {
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  ),
                  title: "Mobile Friendly",
                  description:
                    "Use our converter on any device with our responsive and intuitive interface",
                },
                {
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                  ),
                  title: "Natural Voices",
                  description:
                    "Choose from a variety of natural-sounding voices for your audio conversion",
                },
                {
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  ),
                  title: "Sync Across Devices",
                  description:
                    "Start on your computer and continue listening on your phone seamlessly",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-slate-50 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-100 group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  viewport={{ once: true, margin: "-50px" }}
                  whileHover={{ y: -5 }}
                >
                  <motion.div
                    className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 mb-6 group-hover:bg-teal-200 transition-colors duration-300"
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          id="how-it-works"
          className="py-24 bg-gradient-to-b from-slate-50 to-white"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <motion.div
                className="inline-block px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium mb-4"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                How It Works
              </motion.div>
              <motion.h2
                className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                Simple Three-Step Process
              </motion.h2>
              <motion.p
                className="max-w-2xl mx-auto text-xl text-slate-600"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
              >
                Converting your PDFs to audio has never been easier
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Upload Your PDF",
                  description:
                    "Drag and drop your PDF file or click to browse your files",
                },
                {
                  step: "02",
                  title: "Process Document",
                  description:
                    "Our system extracts and processes the text from your PDF",
                },
                {
                  step: "03",
                  title: "Listen & Control",
                  description:
                    "Listen to your document and control playback with voice commands",
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  className="relative"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 * index }}
                  viewport={{ once: true, margin: "-50px" }}
                >
                  <motion.div
                    className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 relative z-10 border border-slate-100"
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <motion.div
                      className="text-5xl font-bold text-teal-100 mb-6"
                      animate={{
                        opacity: [0.5, 1, 0.5],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        duration: 3,
                        repeatType: "reverse",
                      }}
                    >
                      {step.step}
                    </motion.div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-slate-600">{step.description}</p>
                  </motion.div>
                  {index < 2 && (
                    <motion.div
                      className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-0"
                      animate={{
                        x: [0, 10, 0],
                      }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        duration: 2,
                        repeatType: "reverse",
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-teal-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          id="contact"
          className="py-24 bg-gradient-to-b from-white to-slate-50"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <motion.div
                className="inline-block px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium mb-4"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                Contact Us
              </motion.div>
              <motion.h2
                className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                Get In Touch
              </motion.h2>
              <motion.p
                className="max-w-2xl mx-auto text-xl text-slate-600"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
              >
                Have questions or feedback? We'd love to hear from you
              </motion.p>
            </div>

            <motion.div
              className="max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100">
                <div className="p-8">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-slate-700 mb-1"
                        >
                          Name
                        </label>
                        <motion.input
                          type="text"
                          id="name"
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="Your name"
                          whileFocus={{ scale: 1.01 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 10,
                          }}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-slate-700 mb-1"
                        >
                          Email
                        </label>
                        <motion.input
                          type="email"
                          id="email"
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="your.email@example.com"
                          whileFocus={{ scale: 1.01 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 10,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium text-slate-700 mb-1"
                      >
                        Subject
                      </label>
                      <motion.input
                        type="text"
                        id="subject"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="How can we help you?"
                        whileFocus={{ scale: 1.01 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-slate-700 mb-1"
                      >
                        Message
                      </label>
                      <motion.textarea
                        id="message"
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        placeholder="Your message..."
                        whileFocus={{ scale: 1.01 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      ></motion.textarea>
                    </div>
                    <div>
                      <motion.button
                        type="submit"
                        className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:from-teal-700 hover:to-teal-800 transition-all duration-300"
                        whileHover={{ scale: 1.02, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        Send Message
                      </motion.button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </main>

      {/* Floating back to top button */}
      <AnimatePresence>
        {scrollPosition > 500 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 w-12 h-12 bg-teal-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-teal-700 transition-colors z-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
<style>{`
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); } 
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
  @keyframes ping {
    0% { transform: scale(1); opacity: 1; }
    75%, 100% { transform: scale(1.2); opacity: 0; }
  }
  .animate-ping {
    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
`}</style>;
