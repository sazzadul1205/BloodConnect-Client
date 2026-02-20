// Pages/auth/TermsPrivacy.jsx

// React
import { Link } from "react-router";
import React, { useState } from "react";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  FaTint, FaShieldAlt, FaHeartbeat, FaArrowLeft,
  FaFileContract, FaLock, FaUserSecret, FaCookieBite,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe,
  FaCheckCircle, FaExclamationTriangle, FaHandshake,
  FaServer, FaCreditCard, FaGavel, FaCalendarAlt
} from "react-icons/fa";

const TermsPrivacy = () => {
  const [activeTab, setActiveTab] = useState("terms");
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const termsSections = [
    {
      id: "acceptance",
      icon: FaHandshake,
      title: "Acceptance of Terms",
      content: "By accessing or using BloodConnect, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you may not access or use our services. These terms constitute a legally binding agreement between you and BloodConnect regarding your use of the platform.",
      lastUpdated: "January 15, 2024"
    },
    {
      id: "eligibility",
      icon: FaCheckCircle,
      title: "Eligibility Requirements",
      content: "To use BloodConnect, you must be at least 18 years old and legally capable of entering into binding contracts. Blood donors must meet specific health criteria including minimum weight of 50kg, hemoglobin levels above 12.5 g/dL, and no recent tattoos/piercings in the last 6 months. Blood recipients must provide accurate medical information and emergency contact details.",
      lastUpdated: "February 1, 2024"
    },
    {
      id: "donor-responsibilities",
      icon: FaHeartbeat,
      title: "Donor Responsibilities",
      content: "Donors agree to provide accurate health information, maintain updated availability status, respond to emergency requests promptly, complete the donation process when committed, and adhere to donation frequency guidelines (minimum 56 days between whole blood donations). Donors must immediately report any health changes affecting donation eligibility.",
      lastUpdated: "January 20, 2024"
    },
    {
      id: "requester-responsibilities",
      icon: FaExclamationTriangle,
      title: "Requester Responsibilities",
      content: "Blood requesters agree to provide accurate patient information, verify blood type compatibility before transfusion, use requested blood only for intended patients, report any adverse reactions, and maintain confidentiality of donor information. Requesters must not misuse the emergency request system or make frivolous requests.",
      lastUpdated: "January 18, 2024"
    },
    {
      id: "code-of-conduct",
      icon: FaGavel,
      title: "Code of Conduct",
      content: "Users must treat all community members with respect, refrain from harassment or discrimination, provide accurate information, respect privacy of others, not engage in fraudulent activities, and comply with all applicable laws. BloodConnect reserves the right to suspend accounts violating these conduct rules.",
      lastUpdated: "February 5, 2024"
    },
    {
      id: "limitation-liability",
      icon: FaShieldAlt,
      title: "Limitation of Liability",
      content: "BloodConnect acts as a connecting platform and is not responsible for the actual transfusion process, medical outcomes, or actions of users. We do not guarantee donor availability or response times. Users acknowledge that blood donation and transfusion carry inherent medical risks and agree to hold BloodConnect harmless from any claims arising from such activities.",
      lastUpdated: "January 25, 2024"
    }
  ];

  const privacySections = [
    {
      id: "information-collection",
      icon: FaUserSecret,
      title: "Information We Collect",
      content: "We collect personal information including name, contact details (email, phone), date of birth, blood type, medical eligibility information, location data, device information, and usage data. For donors, we collect donation history and health screening information. For requesters, we collect patient information and emergency contact details. All information is collected with your consent and used only for platform functionality.",
      lastUpdated: "February 10, 2024"
    },
    {
      id: "information-usage",
      icon: FaServer,
      title: "How We Use Your Information",
      content: "Your information is used to facilitate blood donation matching, send notifications about urgent requests, verify eligibility, improve platform services, conduct research to improve donation processes, and comply with legal obligations. We do not sell your personal information to third parties or use it for marketing without explicit consent.",
      lastUpdated: "February 8, 2024"
    },
    {
      id: "information-sharing",
      icon: FaGlobe,
      title: "Information Sharing",
      content: "Limited information (name, blood type, contact details) is shared with hospitals during emergency requests. Medical information is shared only with your explicit consent. We may share aggregated, anonymized data with research institutions. Law enforcement requests for information will be handled in compliance with applicable privacy laws.",
      lastUpdated: "January 30, 2024"
    },
    {
      id: "data-security",
      icon: FaLock,
      title: "Data Security",
      content: "We employ industry-standard encryption (SSL/TLS) for data transmission, secure password hashing, regular security audits, access controls, and monitoring systems. However, no method of transmission over the Internet is 100% secure. Users are responsible for maintaining their password confidentiality and enabling two-factor authentication when available.",
      lastUpdated: "February 12, 2024"
    },
    {
      id: "cookies",
      icon: FaCookieBite,
      title: "Cookie Policy",
      content: "We use essential cookies for authentication and platform functionality, analytics cookies to improve user experience, and preference cookies to remember your settings. You can control cookie preferences through your browser settings, but disabling certain cookies may affect platform functionality. We do not use tracking cookies for advertising purposes.",
      lastUpdated: "January 22, 2024"
    },
    {
      id: "user-rights",
      icon: FaFileContract,
      title: "Your Rights",
      content: "You have the right to access your personal data, request corrections to inaccurate information, request deletion of your account, export your data, withdraw consent for data processing, and object to certain processing activities. To exercise these rights, contact our Data Protection Officer at privacy@bloodconnect.com.",
      lastUpdated: "February 14, 2024"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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
      },
    },
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-base-100 to-base-200 relative overflow-hidden">

      {/* Animated Background Blood Drops */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -100 }}
            animate={{
              opacity: [0.05, 0.15, 0.05],
              y: ["0vh", "100vh"],
              rotate: [0, 360]
            }}
            transition={{
              duration: 15 + i * 2,
              repeat: Infinity,
              delay: i * 2,
              ease: "linear"
            }}
            className="absolute text-error/5 text-8xl"
          // style={{ left: `${Math.random() * 100}%` }}
          >
            <FaTint />
          </motion.div>
        ))}
      </div>

      {/* Header with Back Button */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05, x: -5 }}
            className="btn btn-ghost btn-sm gap-2 bg-base-100/50 backdrop-blur-sm hover:bg-error hover:text-white transition-all duration-300 mb-6"
          >
            <FaArrowLeft /> Back to Home
          </motion.button>
        </Link>
      </div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-block relative mb-4">
            <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto">
              <FaFileContract className="text-4xl text-error" />
            </div>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.2, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full border-2 border-error"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-linear-to-r from-error to-error/70 bg-clip-text text-transparent mb-4">
            Legal & Privacy
          </h1>
          <p className="text-lg opacity-80 max-w-3xl mx-auto">
            Our commitment to transparency, security, and your rights.
            Please read these documents carefully before using BloodConnect.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <div className="tabs tabs-boxed bg-base-200/50 backdrop-blur-sm p-1">
            <button
              className={`tab tab-lg gap-2 ${activeTab === "terms" ? "tab-active bg-error text-white" : ""}`}
              onClick={() => setActiveTab("terms")}
            >
              <FaGavel className="text-sm" />
              Terms of Service
            </button>
            <button
              className={`tab tab-lg gap-2 ${activeTab === "privacy" ? "tab-active bg-error text-white" : ""}`}
              onClick={() => setActiveTab("privacy")}
            >
              <FaUserSecret className="text-sm" />
              Privacy Policy
            </button>
          </div>
        </motion.div>

        {/* Last Updated Banner */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="alert bg-base-200/50 backdrop-blur-sm border border-error/20">
            <FaCalendarAlt className="text-error" />
            <span>
              <strong>Last Updated:</strong> {activeTab === "terms" ? "February 15, 2024" : "February 14, 2024"}
            </span>
            <div className="badge badge-error gap-1 ml-2">
              <FaHeartbeat className="text-xs" />
              Version 2.0
            </div>
          </div>
        </motion.div>

        {/* Content Sections */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Terms Sections */}
            {activeTab === "terms" && (
              <div className="space-y-4">
                {termsSections.map((section) => (
                  <motion.div
                    key={section.id}
                    variants={itemVariants}
                    className="card bg-base-100/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all border border-error/10"
                  >
                    <div
                      className="card-body p-6 cursor-pointer"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center">
                            <section.icon className="text-xl text-error" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">{section.title}</h2>
                            <p className="text-xs opacity-60">Last updated: {section.lastUpdated}</p>
                          </div>
                        </div>
                        <button className="btn btn-ghost btn-sm">
                          {expandedSections[section.id] ? "−" : "+"}
                        </button>
                      </div>

                      <AnimatePresence>
                        {expandedSections[section.id] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 pl-16"
                          >
                            <div className="prose max-w-none">
                              <p className="text-base opacity-80 leading-relaxed">
                                {section.content}
                              </p>
                            </div>

                            {/* Additional details for specific sections */}
                            {section.id === "eligibility" && (
                              <div className="mt-4 p-4 bg-base-200 rounded-xl">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                  <FaHeartbeat className="text-error" />
                                  Donor Eligibility Checklist:
                                </h3>
                                <ul className="list-disc list-inside space-y-1 text-sm opacity-70">
                                  <li>Age: 18-65 years</li>
                                  <li>Weight: Minimum 50kg (110 lbs)</li>
                                  <li>Hemoglobin: ≥12.5 g/dL</li>
                                  <li>Blood pressure: 90-160 systolic, 60-100 diastolic</li>
                                  <li>No recent infections or medications</li>
                                  <li>No high-risk activities in last 6 months</li>
                                </ul>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Privacy Sections */}
            {activeTab === "privacy" && (
              <div className="space-y-4">
                {privacySections.map((section) => (
                  <motion.div
                    key={section.id}
                    variants={itemVariants}
                    className="card bg-base-100/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all border border-error/10"
                  >
                    <div
                      className="card-body p-6 cursor-pointer"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center">
                            <section.icon className="text-xl text-error" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">{section.title}</h2>
                            <p className="text-xs opacity-60">Last updated: {section.lastUpdated}</p>
                          </div>
                        </div>
                        <button className="btn btn-ghost btn-sm">
                          {expandedSections[section.id] ? "−" : "+"}
                        </button>
                      </div>

                      <AnimatePresence>
                        {expandedSections[section.id] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 pl-16"
                          >
                            <div className="prose max-w-none">
                              <p className="text-base opacity-80 leading-relaxed">
                                {section.content}
                              </p>
                            </div>

                            {/* Data Collection Table for specific sections */}
                            {section.id === "information-collection" && (
                              <div className="mt-4 overflow-x-auto">
                                <table className="table table-zebra text-sm">
                                  <thead>
                                    <tr>
                                      <th>Data Category</th>
                                      <th>Examples</th>
                                      <th>Purpose</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td>Identity Data</td>
                                      <td>Name, DOB, Blood Type</td>
                                      <td>Verification, Matching</td>
                                    </tr>
                                    <tr>
                                      <td>Contact Data</td>
                                      <td>Email, Phone, Address</td>
                                      <td>Notifications, Emergency</td>
                                    </tr>
                                    <tr>
                                      <td>Medical Data</td>
                                      <td>Health History, Eligibility</td>
                                      <td>Safety, Compliance</td>
                                    </tr>
                                    <tr>
                                      <td>Usage Data</td>
                                      <td>Donations, Requests</td>
                                      <td>Service Improvement</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Contact Section */}
        <motion.div variants={itemVariants} className="mt-12">
          <div className="card bg-linear-to-br from-error to-error/80 text-error-content">
            <div className="card-body p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Questions About Our Policies?</h2>
              <p className="mb-6 max-w-2xl mx-auto">
                Our legal team is here to help. Contact us for any questions about our
                Terms of Service or Privacy Policy.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <div className="flex flex-col items-center p-4 bg-error-content/10 rounded-xl">
                  <FaEnvelope className="text-2xl mb-2" />
                  <span className="text-sm font-semibold">Email</span>
                  <span className="text-xs opacity-90">legal@bloodconnect.com</span>
                </div>

                <div className="flex flex-col items-center p-4 bg-error-content/10 rounded-xl">
                  <FaPhone className="text-2xl mb-2" />
                  <span className="text-sm font-semibold">Phone</span>
                  <span className="text-xs opacity-90">+1 (800) 123-4567</span>
                </div>

                <div className="flex flex-col items-center p-4 bg-error-content/10 rounded-xl">
                  <FaMapMarkerAlt className="text-2xl mb-2" />
                  <span className="text-sm font-semibold">Address</span>
                  <span className="text-xs opacity-90">123 Blood Drive, NY 10001</span>
                </div>
              </div>

              {/* Response Time Badge */}
              <div className="mt-6">
                <div className="badge badge-outline border-error-content text-error-content gap-2 p-4">
                  <FaHeartbeat className="animate-pulse" />
                  <span>Average response time: 24 hours</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.div variants={itemVariants} className="mt-8 text-center text-sm opacity-60">
          <p>
            By using BloodConnect, you acknowledge that you have read and understood our
            Terms of Service and Privacy Policy.
          </p>
          <p className="mt-2">
            <FaShieldAlt className="inline mr-1 text-error" />
            Protected by end-to-end encryption and industry security standards
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TermsPrivacy;