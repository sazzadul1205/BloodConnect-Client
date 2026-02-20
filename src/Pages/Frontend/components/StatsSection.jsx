// Pages/Frontend/components/StatsSection.jsx

import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import { FaUserFriends, FaHeartbeat, FaHospital, FaClock } from "react-icons/fa";

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

const StatsSection = () => {
  const stats = [
    {
      icon: FaUserFriends,
      value: "5,000+",
      label: "Registered Donors",
      trend: "↑ 28% this month",
      gradient: true,
    },
    {
      icon: FaHeartbeat,
      value: "2,300+",
      label: "Lives Saved",
      trend: "+147 this week",
      color: "error",
    },
    {
      icon: FaHospital,
      value: "120+",
      label: "Partner Hospitals",
      trend: "Across 25 cities",
    },
    {
      icon: FaClock,
      value: "24/7",
      label: "Active Support",
      trend: "Always here for you",
    },
  ];

  return (
    <motion.section
      id="stats"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="py-16 lg:py-24 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div variants={fadeUp}>
          <SectionHeader
            title="Our Impact in Numbers"
            subtitle="Making a difference together"
          />
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={fadeUp}>
              <StatCard stat={stat} />
            </motion.div>
          ))}
        </motion.div>

      </div>
    </motion.section>
  );
};

const SectionHeader = ({ title, subtitle }) => (
  <div className="text-center mb-10 lg:mb-14">
    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
      {title}
    </h2>
    <p className="opacity-70 mt-3 text-sm sm:text-base">
      {subtitle}
    </p>
  </div>
);

const StatCard = ({ stat }) => {
  const Icon = stat.icon;

  const colorMap = {
    error: "text-error",
  };

  if (stat.gradient) {
    return (
      <div className="card bg-linear-to-br from-error to-error/80 text-error-content shadow-lg hover:shadow-2xl transition-all">
        <div className="card-body items-center text-center p-6">
          <Icon className="text-4xl sm:text-5xl mb-4" />
          <h3 className="text-3xl sm:text-4xl font-bold">{stat.value}</h3>
          <p className="opacity-90">{stat.label}</p>
          <p className="text-sm opacity-80 mt-2">{stat.trend}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
      <div className="card-body items-center text-center p-6">
        <Icon
          className={`${colorMap[stat.color] || "text-error"} text-4xl sm:text-5xl mb-4`}
        />
        <h3 className="text-3xl sm:text-4xl font-bold">{stat.value}</h3>
        <p className="opacity-70">{stat.label}</p>
        <p
          className={`text-sm mt-2 ${stat.trend?.includes("+") ? "text-success" : "opacity-70"
            }`}
        >
          {stat.trend}
        </p>
      </div>
    </div>
  );
};

export default StatsSection;