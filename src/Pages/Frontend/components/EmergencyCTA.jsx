// Pages/Frontend/components/EmergencyCTA.jsx

import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaAmbulance, FaPhone } from "react-icons/fa";

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

const EmergencyCTA = () => {
  return (
    <motion.section
      id="emergency-cta"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
      className="py-16 lg:py-24 bg-linear-to-r from-error to-error/80 text-error-content"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        <motion.div variants={fadeUp}>
          <EmergencyIcon />
        </motion.div>

        <motion.h2
          variants={fadeUp}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
        >
          Need Blood Urgently?
        </motion.h2>

        <motion.p
          variants={fadeUp}
          className="text-base sm:text-lg lg:text-xl mb-8 max-w-2xl mx-auto"
        >
          Our emergency response team is available 24/7. Get connected with donors in your area within minutes.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button className="btn btn-outline btn-lg border-error-content text-error-content hover:bg-error-content hover:text-error transition-all duration-300 flex items-center justify-center">
            <FaPhone className="mr-2" /> Emergency Hotline
          </button>
          <button className="btn btn-lg bg-error-content text-error border-error-content hover:bg-transparent hover:text-error-content transition-all duration-300">
            Find Donors Now
          </button>
        </motion.div>

      </div>
    </motion.section>
  );
};

const EmergencyIcon = () => (
  <FaAmbulance className="text-5xl sm:text-6xl lg:text-7xl mx-auto mb-6 animate-bounce" />
);

export default EmergencyCTA;