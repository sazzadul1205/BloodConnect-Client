// Pages/Frontend/components/HeroSection.jsx

import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaTint, FaHeartbeat, FaChevronRight } from "react-icons/fa";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
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

const HeroSection = () => {
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <>
      <title>BloodConnect | Donate Blood, Save Lives</title>
      <meta
        name="description"
        content="Find blood donors instantly. Join BloodConnect and help save lives today."
      />

      <section
        id="hero"
        className="relative min-h-[90vh] flex items-center overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 text-error text-[200px] rotate-12">
            <FaTint />
          </div>
          <div className="absolute bottom-20 right-10 text-error text-[150px] -rotate-12">
            <FaTint />
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left Content */}
            <motion.div variants={containerVariants} className="space-y-8">

              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 bg-error/10 text-error px-4 py-2 rounded-full"
              >
                <FaHeartbeat className="animate-pulse" />
                <span className="font-semibold">
                  Emergency Response Available 24/7
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-5xl lg:text-7xl font-bold leading-tight"
              >
                Donate Blood.
                <span className="text-error block">Save Lives.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-xl opacity-80 max-w-xl"
              >
                Join 5,000+ life-savers in our community. Find donors instantly or
                respond to emergency blood requests near you.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                <button className="btn btn-error btn-lg gap-2 group">
                  Become a Donor
                  <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="btn btn-outline btn-primary btn-lg">
                  Request Blood
                </button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="grid grid-cols-3 gap-4 pt-8"
              >
                <QuickStat value="24/7" label="Emergency Support" />
                <QuickStat value="<30 min" label="Response Time" />
                <QuickStat value="100%" label="Free Service" />
              </motion.div>

            </motion.div>

            {/* Right Side */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {bloodTypes.map((type) => (
                <motion.div key={type} variants={fadeUp}>
                  <BloodTypeCard type={type} />
                </motion.div>
              ))}
            </motion.div>

          </div>
        </motion.div>
      </section>
    </>
  );
};

const QuickStat = ({ value, label }) => (
  <div>
    <div className="text-2xl font-bold text-error">{value}</div>
    <div className="text-sm opacity-70">{label}</div>
  </div>
);

const BloodTypeCard = ({ type }) => (
  <div className="card bg-base-100/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
    <div className="card-body items-center p-4">
      <div className="text-3xl font-bold text-error">{type}</div>
      <div className="text-xs opacity-70">Blood Type</div>
    </div>
  </div>
);

export default HeroSection;
