// Pages/Frontend/components/HowItWorks.jsx

import React, { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaTint, FaGlobe, FaMedal, FaChevronRight } from "react-icons/fa";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const HowItWorks = () => {
  const [selectedStep, setSelectedStep] = useState(null);

  const steps = [
    {
      step: "01",
      title: "Register",
      description:
        "Sign up in under 2 minutes. Provide your blood type, location, and availability.",
      icon: FaTint,
      color: "bg-red-500",
      details:
        "Fill out your personal info, blood type, location, and availability so we can match you quickly with nearby emergency requests.",
    },
    {
      step: "02",
      title: "Connect",
      description:
        "Get matched with those in need based on proximity and compatibility.",
      icon: FaGlobe,
      color: "bg-blue-500",
      details:
        "Our system instantly finds compatible donors nearby and sends notifications when a match occurs.",
    },
    {
      step: "03",
      title: "Save Lives",
      description:
        "Receive notifications and schedule your donation appointments.",
      icon: FaMedal,
      color: "bg-green-500",
      details:
        "Schedule your donation, help patients in urgent need, and track the impact of your contributions.",
    },
  ];

  return (
    <motion.section
      id="how-it-works"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
      className="py-16 lg:py-24 bg-linear-to-b from-base-100 to-base-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div variants={fadeUp} className="text-center mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold">
            How It Works
          </h2>
          <p className="opacity-70 mt-3 text-sm sm:text-base lg:text-lg">
            Simple process. Real impact.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {steps.map((step, idx) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={idx}
                variants={fadeUp}
                className="relative bg-base-100 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
              >
                {/* Icon Circle */}
                <div
                  className={`absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl ${step.color} shadow-lg`}
                >
                  <Icon />
                </div>

                <div className="p-6 sm:p-8 pt-14 sm:pt-16 text-center">
                  <span className="text-5xl sm:text-6xl font-extrabold opacity-10">
                    {step.step}
                  </span>

                  <h3 className="text-xl sm:text-2xl font-bold mt-4">
                    {step.title}
                  </h3>

                  <p className="opacity-70 mt-3 text-sm sm:text-base">
                    {step.description}
                  </p>

                  <button
                    onClick={() => setSelectedStep(step)}
                    className="mt-6 inline-flex items-center text-primary font-semibold hover:gap-3 transition-all duration-300"
                  >
                    Learn More
                    <FaChevronRight className="ml-2 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Modal */}
      {selectedStep && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg relative p-6 sm:p-8 rounded-3xl">
            <button
              className="btn btn-ghost btn-sm btn-circle absolute right-4 top-4"
              onClick={() => setSelectedStep(null)}
            >
              ✕
            </button>

            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl mx-auto mb-6 ${selectedStep.color} shadow-lg`}
            >
              <selectedStep.icon />
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-center mb-4">
              {selectedStep.title}
            </h3>

            <p className="opacity-70 text-center text-sm sm:text-base">
              {selectedStep.details}
            </p>
          </div>
        </div>
      )}
    </motion.section>
  );
};

export default HowItWorks;