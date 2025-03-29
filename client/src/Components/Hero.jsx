"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const Hero = () => {
  const parallaxRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!parallaxRef.current) return;
      const scrollY = window.scrollY;
      const elements =
        parallaxRef.current.querySelectorAll(".parallax-element");

      elements.forEach((el, index) => {
        const speed = index % 2 === 0 ? 0.1 : 0.05;
        el.style.transform = `translateY(${scrollY * speed}px)`;
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  const imageContainerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const featureCardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2 * custom,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 left-10 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl parallax-element"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.08, 0.05],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 8,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-96 h-96 bg-teal-300 opacity-10 rounded-full blur-3xl parallax-element"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 10,
            ease: "easeInOut",
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-48 h-48 bg-amber-400 opacity-10 rounded-full blur-3xl parallax-element"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.1, 0.12, 0.1],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 12,
            ease: "easeInOut",
          }}
        />
      </div>

      <div
        ref={parallaxRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            className="text-left space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="inline-block px-4 py-1.5 bg-slate-800 bg-opacity-50 backdrop-blur-sm rounded-full text-teal-200 text-sm font-medium mb-2"
              variants={itemVariants}
            >
              PDF to Audio Conversion Made Simple
            </motion.div>
            <motion.h1
              className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl"
              variants={itemVariants}
            >
              <span className="block">Transform PDF to</span>
              <span className="block text-teal-200 mt-2">
                <span className="relative inline-block">
                  <span className="relative z-10">Audio Experience</span>
                  <motion.span
                    className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-r from-teal-400 to-amber-400 opacity-50 rounded"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 1, duration: 0.8 }}
                  />
                </span>
              </span>
            </motion.h1>
            <motion.p
              className="mt-6 text-lg text-slate-200 max-w-xl"
              variants={itemVariants}
            >
              Convert your PDF documents into immersive audio experiences with
              our advanced text-to-speech technology. Perfect for multitasking,
              accessibility, and learning on the go.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-wrap gap-4"
              variants={itemVariants}
            >
              <motion.a
                href="#converter"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-slate-900 bg-white hover:bg-slate-50 transition-all duration-300"
                whileHover={{
                  scale: 1.05,
                  y: -5,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                Get Started
              </motion.a>
              <motion.a
                href="#features"
                className="inline-flex items-center px-6 py-3 border border-white border-opacity-30 text-base font-medium rounded-full text-white bg-teal-600 bg-opacity-30 backdrop-blur-sm hover:bg-opacity-50 transition-all duration-300"
                whileHover={{
                  scale: 1.05,
                  y: -5,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                Learn More
              </motion.a>
            </motion.div>
          </motion.div>
          <motion.div
            className="relative"
            variants={imageContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Decorative background elements */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-teal-600 to-slate-600 opacity-20 rounded-3xl transform rotate-3"
              animate={{
                rotate: [3, 5, 3],
                scale: [1, 1.02, 1],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 8,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-teal-400 to-amber-400 opacity-10 rounded-3xl transform -rotate-3"
              animate={{
                rotate: [-3, -5, -3],
                scale: [1, 1.01, 1],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 10,
                ease: "easeInOut",
                repeatType: "reverse",
              }}
            />

            {/* Main image container */}
            <motion.div
              className="relative grid grid-cols-2 gap-6 p-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl shadow-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Left column */}
              <div className="space-y-6">
                <motion.div
                  className="overflow-hidden rounded-2xl shadow-xl"
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="relative group">
                    <img
                      src="https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg"
                      alt="PDF Document"
                      className="w-full h-64 object-cover transform transition-transform duration-500 group-hover:scale-110"
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                    />
                  </div>
                </motion.div>
                <motion.div
                  className="overflow-hidden rounded-2xl shadow-xl"
                  whileHover={{ scale: 1.05, rotate: -1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="relative group">
                    <img
                      src="https://images.pexels.com/photos/3184464/pexels-photo-3184464.jpeg"
                      alt="Audio Headphones"
                      className="w-full h-64 object-cover transform transition-transform duration-500 group-hover:scale-110"
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Right column */}
              <div className="space-y-6 pt-12">
                <motion.div
                  className="overflow-hidden rounded-2xl shadow-xl"
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="relative group">
                    <img
                      src="https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg"
                      alt="Voice Recognition"
                      className="w-full h-64 object-cover transform transition-transform duration-500 group-hover:scale-110"
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                    />
                  </div>
                </motion.div>
                <motion.div
                  className="overflow-hidden rounded-2xl shadow-xl"
                  whileHover={{ scale: 1.05, rotate: -1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="relative group">
                    <img
                      src="https://images.pexels.com/photos/3184462/pexels-photo-3184462.jpeg"
                      alt="Text to Speech"
                      className="w-full h-64 object-cover transform transition-transform duration-500 group-hover:scale-110"
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                    />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
        <div className="mt-20">
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
                title: "Lightning Fast",
                description:
                  "Convert your PDFs to audio in seconds with our optimized processing engine",
                color: "from-teal-600 to-teal-700",
                iconColor: "text-teal-600",
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
                  "Navigate and control your audio with natural voice commands for hands-free operation",
                color: "from-slate-700 to-slate-800",
                iconColor: "text-slate-700",
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
                  "Access your audio PDFs on any device with our responsive and intuitive interface",
                color: "from-amber-500 to-amber-600",
                iconColor: "text-amber-600",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className={`bg-gradient-to-br ${feature.color} rounded-2xl p-8 text-center transform transition-all duration-500 hover:shadow-xl`}
                variants={featureCardVariants}
                initial="hidden"
                animate="visible"
                custom={index}
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.div
                  className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center mb-6 shadow-lg"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <motion.div
                    className={feature.iconColor}
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 2,
                      repeatType: "reverse",
                    }}
                  >
                    {feature.icon}
                  </motion.div>
                </motion.div>
                <h3 className="text-white text-xl font-semibold mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/80">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Add custom styles for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.8s ease-out forwards;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.8s ease-out forwards;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(3deg);
          }
          50% {
            transform: translateY(-10px) rotate(3deg);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0) rotate(-3deg);
          }
          50% {
            transform: translateY(10px) rotate(-3deg);
          }
        }
        .animate-float-delayed {
          animation: float-delayed 6s ease-in-out infinite;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        .animate-slideInLeft-delayed {
          animation: slideInLeft 0.8s ease-out forwards;
          animation-delay: 0.2s;
        }

        .animate-slideInRight-delayed {
          animation: slideInRight 0.8s ease-out forwards;
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
};

export default Hero;
