// Pages/Frontend/components/BloodCompatibility.jsx

import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaTint, FaShieldAlt } from "react-icons/fa";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const BloodCompatibility = () => {
  const compatibilityData = [
    { type: "O-", donateTo: "All types", receiveFrom: "O-" },
    { type: "O+", donateTo: "O+, A+, B+, AB+", receiveFrom: "O+, O-" },
    { type: "A-", donateTo: "A-, A+, AB-, AB+", receiveFrom: "A-, O-" },
    { type: "A+", donateTo: "A+, AB+", receiveFrom: "A+, A-, O+, O-" },
    { type: "B-", donateTo: "B-, B+, AB-, AB+", receiveFrom: "B-, O-" },
    { type: "B+", donateTo: "B+, AB+", receiveFrom: "B+, B-, O+, O-" },
    { type: "AB-", donateTo: "AB-, AB+", receiveFrom: "All negative types, O-" },
    { type: "AB+", donateTo: "AB+ only", receiveFrom: "All types" },
  ];

  return (
    <motion.section
      id="compatibility"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={containerVariants}
      className="py-12 sm:py-16 lg:py-24 bg-base-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* Info */}
          <motion.div variants={fadeUp} className="order-2 lg:order-1">
            <CompatibilityInfo />
          </motion.div>

          {/* Chart */}
          <motion.div variants={fadeUp} className="order-1 lg:order-2">
            <CompatibilityChart data={compatibilityData} />
          </motion.div>

        </div>
      </div>
    </motion.section>
  );
};

const CompatibilityInfo = () => (
  <div className="text-center lg:text-left">
    {/* Mobile optimized title */}
    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
      Blood Type <span className="text-error">Compatibility</span>
    </h2>

    {/* Mobile optimized description */}
    <p className="text-sm sm:text-base lg:text-lg opacity-80 mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 px-2 sm:px-0">
      Understanding blood type compatibility is crucial for safe transfusions.
      Universal donors (O-) can give to anyone, while universal recipients (AB+)
      can receive from all types.
    </p>

    {/* Info items - stacked on mobile, row on larger screens */}
    <div className="space-y-4 sm:space-y-6 lg:space-y-6">
      <InfoItem
        icon={FaTint}
        color="error"
        title="Universal Donor"
        description="Type O- can donate to anyone in emergencies"
      />
      <InfoItem
        icon={FaShieldAlt}
        color="primary"
        title="Universal Recipient"
        description="Type AB+ can receive from all blood types"
      />
    </div>

    {/* Quick tip for mobile users */}
    <div className="mt-6 sm:mt-8 lg:hidden">
      <div className="bg-base-100 p-3 rounded-lg text-xs sm:text-sm opacity-75">
        💡 Tip: Scroll the table horizontally to see all compatibility info
      </div>
    </div>
  </div>
);

// eslint-disable-next-line no-unused-vars
const InfoItem = ({ icon: Icon, color, title, description }) => {
  const colorMap = {
    error: { text: "text-error", bg: "bg-error/10", border: "border-error/20" },
    primary: { text: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 p-3 sm:p-0 rounded-lg sm:rounded-none
                  ${colorMap[color].border} sm:border-0 border`}
    >
      {/* Icon - responsive sizing */}
      <div
        className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 ${colorMap[color].bg} 
                    rounded-full flex items-center justify-center shrink-0
                    shadow-lg sm:shadow-none`}
      >
        <Icon className={`${colorMap[color].text} text-xl sm:text-2xl lg:text-3xl`} />
      </div>

      {/* Text content - centered on mobile, left-aligned on tablet+ */}
      <div className="text-center sm:text-left">
        <h3 className="font-bold text-base sm:text-lg lg:text-xl">{title}</h3>
        <p className="opacity-70 text-xs sm:text-sm lg:text-base max-w-62.5 sm:max-w-none">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

const CompatibilityChart = ({ data }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300"
  >
    <div className="card-body p-3 sm:p-5 lg:p-6">
      {/* Chart title with responsive sizing */}
      <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4 text-center lg:text-left">
        Compatibility Chart
        <span className="block sm:hidden text-xs font-normal opacity-60 mt-1">
          ← Swipe to see more →
        </span>
      </h3>

      {/* Scrollable wrapper with visual indicators for mobile */}
      <div className="relative">
        {/* Gradient indicators for scrollable content (mobile only) */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-linear-to-r from-base-100 to-transparent pointer-events-none sm:hidden"></div>
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-linear-to-l from-base-100 to-transparent pointer-events-none sm:hidden"></div>

        {/* Scrollable table container */}
        <div className="overflow-x-auto w-full">
          <table className="table table-zebra text-xs sm:text-sm lg:text-base w-full">
            <thead>
              <tr>
                <th className="bg-base-200 text-xs sm:text-sm">Blood Type</th>
                <th className="bg-base-200 text-xs sm:text-sm">Donate To</th>
                <th className="bg-base-200 text-xs sm:text-sm">Receive From</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-base-200 transition-colors">
                  <td className="font-bold">
                    <span className="text-error text-xs sm:text-sm lg:text-base whitespace-nowrap">
                      {row.type}
                    </span>
                  </td>
                  <td className="text-xs sm:text-sm">
                    <span className="block sm:hidden font-bold text-error/70">Donates to:</span>
                    {row.donateTo}
                  </td>
                  <td className="text-xs sm:text-sm">
                    <span className="block sm:hidden font-bold text-error/70">Receives from:</span>
                    {row.receiveFrom}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile view toggle - shows simplified view */}
      <div className="mt-3 sm:hidden">
        <details className="collapse collapse-arrow bg-base-200">
          <summary className="collapse-title text-sm font-medium">
            View Quick Reference
          </summary>
          <div className="collapse-content">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-error/10 p-2 rounded">
                <span className="font-bold text-error">O-</span>
                <p className="opacity-70">Universal Donor</p>
              </div>
              <div className="bg-primary/10 p-2 rounded">
                <span className="font-bold text-primary">AB+</span>
                <p className="opacity-70">Universal Recipient</p>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  </motion.div>
);

export default BloodCompatibility;