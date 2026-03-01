// Pages/auth/TermsPrivacy.jsx

import { Link } from "react-router";
import React, { useState, useEffect, useRef } from "react";
import {
  FaShieldAlt,
  FaHeartbeat,
  FaArrowLeft,
  FaFileContract,
  FaLock,
  FaUserSecret,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHandshake,
  FaGavel,
  FaCalendarAlt,
  FaBookOpen,
  FaBalanceScale,
  FaUserLock,
  FaClipboardCheck,
  FaQuestionCircle,
  FaComments,
  FaPrint,
  FaDownload,
  FaShare,
  FaChevronUp,
  FaChevronDown,
  FaTimes,
  FaGlobe,
  FaCookieBite,
  FaLink,
} from "react-icons/fa";

const termsSections = [
  {
    id: "acceptance",
    icon: FaHandshake,
    title: "Acceptance of Terms",
    content:
      "By accessing or using BloodConnect, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. These terms constitute a legally binding agreement between you and BloodConnect.",
    highlights: ["Legal agreement", "Binding contract", "User acknowledgment"],
    lastUpdated: "March 15, 2024",
  },
  {
    id: "eligibility",
    icon: FaClipboardCheck,
    title: "Eligibility Requirements",
    content:
      "You must be 18 years or older and meet standard blood donor eligibility criteria to use the platform. Verification of eligibility may be required. Users must provide accurate and complete information during registration.",
    highlights: ["Age requirement: 18+", "Medical screening", "Identity verification"],
    lastUpdated: "March 15, 2024",
  },
  {
    id: "liability",
    icon: FaShieldAlt,
    title: "Limitation of Liability",
    content:
      "BloodConnect acts only as a connecting platform and is not responsible for medical outcomes, donor-recipient interactions, or any health-related incidents. Users assume all risks associated with blood donation and transfusion. We do not guarantee donor availability or response times.",
    highlights: ["Platform role", "User responsibility", "Medical disclaimer"],
    lastUpdated: "March 15, 2024",
  },
  {
    id: "conduct",
    icon: FaBalanceScale,
    title: "User Conduct",
    content:
      "Users must maintain respectful communication, provide accurate information, and comply with all applicable laws and regulations. Harassment, discrimination, or misuse of the platform is strictly prohibited and may result in account termination.",
    highlights: ["Respectful behavior", "Accurate data", "Legal compliance"],
    lastUpdated: "March 15, 2024",
  },
  {
    id: "termination",
    icon: FaTimes,
    title: "Account Termination",
    content:
      "We reserve the right to suspend or terminate accounts that violate our terms, engage in fraudulent activity, or pose a risk to other users. Users may also delete their accounts at any time through settings.",
    highlights: ["Violation consequences", "User rights", "Account deletion"],
    lastUpdated: "March 15, 2024",
  },
];

const privacySections = [
  {
    id: "collection",
    icon: FaUserLock,
    title: "Information We Collect",
    content:
      "We collect personal information (name, contact details, date of birth), medical eligibility data, blood type, donation history, and usage information required to operate and improve the platform. This includes location data for emergency matching and device information for security.",
    highlights: ["Personal data", "Medical eligibility", "Usage analytics", "Location data"],
    lastUpdated: "March 10, 2024",
  },
  {
    id: "usage",
    icon: FaBookOpen,
    title: "How We Use Your Data",
    content:
      "Your data is used strictly for matching donors with recipients, sending emergency notifications, platform improvements, and regulatory compliance. We never sell your personal information. Data may be anonymized for research purposes.",
    highlights: ["Donor matching", "Emergency alerts", "No data selling", "Research"],
    lastUpdated: "March 10, 2024",
  },
  {
    id: "security",
    icon: FaLock,
    title: "Data Security",
    content:
      "We employ industry-standard encryption (256-bit), secure authentication protocols, regular security audits, and strict access controls to protect your data. Multi-factor authentication is available for added security.",
    highlights: ["256-bit encryption", "Secure authentication", "Regular audits", "MFA support"],
    lastUpdated: "March 10, 2024",
  },
  {
    id: "rights",
    icon: FaCheckCircle,
    title: "Your Rights",
    content:
      "You have the right to access, correct, or delete your personal data. You can export your data in JSON format or withdraw consent at any time through account settings. Requests are processed within 30 days.",
    highlights: ["Access data", "Delete data", "Export options", "30-day response"],
    lastUpdated: "March 10, 2024",
  },
  {
    id: "cookies",
    icon: FaCookieBite,
    title: "Cookie Policy",
    content:
      "We use essential cookies for authentication and functionality, analytics cookies to improve user experience, and preference cookies to remember your settings. You can control cookie preferences through browser settings.",
    highlights: ["Essential cookies", "Analytics", "User preferences", "Browser controls"],
    lastUpdated: "March 10, 2024",
  },
];


const TermsPrivacy = () => {
  const [activeTab, setActiveTab] = useState("terms");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [copied, setCopied] = useState(false);

  const searchRef = useRef(null);
  const shareMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery.length > 2) {
      const sections = activeTab === "terms" ? termsSections : privacySections;
      const results = sections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.highlights.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, activeTab]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const expandAll = () => {
    const allSections = activeTab === "terms" ? termsSections : privacySections;
    const allExpanded = allSections.reduce((acc, section) => {
      acc[section.id] = true;
      return acc;
    }, {});
    setExpandedSections(allExpanded);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const documents = {
    terms: {
      title: "Terms of Service",
      icon: FaGavel,
      color: "btn-error",
      gradient: "from-error to-error/70",
      version: "3.1",
      lastUpdated: "March 15, 2024",
      description: "Our terms govern your use of BloodConnect platform",
      effectiveDate: "January 1, 2024",
    },
    privacy: {
      title: "Privacy Policy",
      icon: FaUserSecret,
      color: "btn-secondary",
      gradient: "from-secondary to-secondary/70",
      version: "2.8",
      lastUpdated: "March 10, 2024",
      description: "How we collect, use, and protect your data",
      effectiveDate: "January 1, 2024",
    },
  };


  const currentDoc = documents[activeTab];
  const currentSections = activeTab === "terms" ? termsSections : privacySections;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a formatted text version
    const content = currentSections.map(s =>
      `${s.title}\n${s.content}\nHighlights: ${s.highlights.join(', ')}\n`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Blood Connect-${activeTab}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `BloodConnect ${currentDoc.title}`,
          text: currentDoc.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log(`Share cancelled: ${err}`);
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-base-200 to-base-300 py-4 sm:py-6 md:py-10 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto relative">

        {/* Print Styles */}
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-full { width: 100% !important; margin: 0 !important; padding: 0 !important; }
            body { background: white; }
            .card { box-shadow: none; border: 1px solid #ddd; }
          }
        `}</style>

        {/* Header with Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-6 no-print">
          <Link to="/" className="btn btn-ghost btn-sm sm:btn-md gap-1 sm:gap-2">
            <FaArrowLeft className="text-xs sm:text-sm" />
            <span className="text-xs sm:text-sm">Back</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden sm:block relative flex-1 max-w-md mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search in document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearch(true)}
                className="input input-bordered input-sm w-full pl-8"
              />
              <FaGlobe className="absolute left-2 top-1/2 -translate-y-1/2 text-base-content/40 text-xs" />
            </div>

            {/* Search Results */}
            {showSearch && searchQuery.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-base-100 rounded-lg shadow-xl border border-base-300 max-h-64 overflow-y-auto z-50">
                {searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <button
                      key={result.id}
                      className="w-full text-left p-2 hover:bg-base-200 transition-colors text-xs border-b border-base-200 last:border-0"
                      onClick={() => {
                        setExpandedSections(prev => ({ ...prev, [result.id]: true }));
                        setShowSearch(false);
                        setSearchQuery('');
                        document.getElementById(result.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    >
                      <span className="font-medium">{result.title}</span>
                      <p className="text-base-content/60 truncate mt-0.5">{result.content.substring(0, 60)}...</p>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-base-content/60 text-xs">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex gap-2">
            <button onClick={handlePrint} className="btn btn-outline btn-sm gap-1">
              <FaPrint className="text-xs" />
              <span className="text-xs">Print</span>
            </button>
            <button onClick={handleDownload} className="btn btn-outline btn-sm gap-1">
              <FaDownload className="text-xs" />
              <span className="text-xs">PDF</span>
            </button>
            <button onClick={handleShare} className="btn btn-outline btn-sm gap-1 relative">
              <FaShare className="text-xs" />
              <span className="text-xs">Share</span>

              {/* Share Menu */}
              {showShareMenu && (
                <div ref={shareMenuRef} className="absolute top-full right-0 mt-2 bg-base-100 rounded-lg shadow-xl border border-base-300 p-2 min-w-37.5 z-50">
                  <button
                    onClick={() => copyToClipboard(window.location.href)}
                    className="w-full text-left p-2 hover:bg-base-200 rounded-lg text-xs flex items-center gap-2"
                  >
                    <FaLink className="text-error" />
                    Copy Link
                  </button>
                  <button className="w-full text-left p-2 hover:bg-base-200 rounded-lg text-xs flex items-center gap-2">
                    <FaEnvelope className="text-error" />
                    Email
                  </button>
                  <button className="w-full text-left p-2 hover:bg-base-200 rounded-lg text-xs flex items-center gap-2">
                    <FaComments className="text-error" />
                    Message
                  </button>
                  {copied && (
                    <div className="absolute -top-8 right-0 bg-success text-white text-xs py-1 px-2 rounded">
                      Copied!
                    </div>
                  )}
                </div>
              )}
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex sm:hidden gap-1">
            <button onClick={handlePrint} className="btn btn-circle btn-ghost btn-xs">
              <FaPrint className="text-sm" />
            </button>
            <button onClick={handleDownload} className="btn btn-circle btn-ghost btn-xs">
              <FaDownload className="text-sm" />
            </button>
            <button onClick={handleShare} className="btn btn-circle btn-ghost btn-xs relative">
              <FaShare className="text-sm" />

              {/* Mobile Share Menu */}
              {showShareMenu && (
                <div ref={shareMenuRef} className="absolute top-full right-0 mt-2 bg-base-100 rounded-lg shadow-xl border border-base-300 p-2 min-w-30 z-50">
                  <button className="w-full text-left p-2 hover:bg-base-200 rounded-lg text-xs">Copy Link</button>
                  <button className="w-full text-left p-2 hover:bg-base-200 rounded-lg text-xs">Email</button>
                  <button className="w-full text-left p-2 hover:bg-base-200 rounded-lg text-xs">Message</button>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="sm:hidden mb-4 no-print">
          <input
            type="text"
            placeholder="Search in document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered input-sm w-full"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <div className="avatar placeholder mb-2 sm:mb-3">
            <div className="bg-error text-neutral-content rounded-full w-10 sm:w-12 md:w-16 flex items-center justify-center">
              <FaFileContract className="text-lg sm:text-xl md:text-2xl" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold px-2">
            Legal & Privacy
          </h1>
          <p className="text-xs sm:text-sm md:text-base opacity-70 mt-1 max-w-md mx-auto px-3">
            Transparency. Security. Your rights. We're committed to protecting your information.
          </p>
        </div>

        {/* Expand/Collapse Controls */}
        <div className="flex justify-end gap-2 mb-3 sm:mb-4 no-print">
          <button onClick={expandAll} className="btn btn-ghost btn-xs gap-1">
            <FaChevronDown className="text-xs" />
            <span className="text-xs">Expand All</span>
          </button>
          <button onClick={collapseAll} className="btn btn-ghost btn-xs gap-1">
            <FaChevronUp className="text-xs" />
            <span className="text-xs">Collapse All</span>
          </button>
        </div>

        {/* Tabs - Responsive */}
        <div className="tabs tabs-boxed justify-center mb-4 sm:mb-6 p-1 bg-base-100 shadow-sm overflow-x-auto flex-nowrap no-print">
          {Object.entries(documents).map(([key, doc]) => {
            const Icon = doc.icon;
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  setExpandedSections({});
                }}
                className={`tab tab-xs sm:tab-sm md:tab-md gap-1 whitespace-nowrap flex-1 sm:flex-none transition-all ${isActive ? `tab-active bg-linear-to-r ${doc.gradient} text-white` : ""
                  }`}
              >
                <Icon className="text-xs sm:text-sm" />
                <span className="text-[10px] sm:text-xs md:text-sm">{doc.title}</span>
              </button>
            );
          })}
        </div>

        {/* Info Card - Responsive */}
        <div className={`card bg-linear-to-r ${currentDoc.gradient} text-white shadow-lg mb-4 sm:mb-6`}>
          <div className="card-body p-3 sm:p-4 md:p-5">
            <div className="flex flex-col xs:flex-row items-center gap-2 sm:gap-3">
              <div className="btn btn-circle bg-white/20 border-0 hover:bg-white/30 btn-xs sm:btn-sm md:btn-md">
                <currentDoc.icon className="text-xs sm:text-sm md:text-base" />
              </div>
              <div className="text-center xs:text-left flex-1">
                <h2 className="card-title text-sm sm:text-base md:text-lg justify-center xs:justify-start">
                  {currentDoc.title}
                </h2>
                <p className="text-[10px] sm:text-xs md:text-sm opacity-90">
                  {currentDoc.description}
                </p>
              </div>
              <div className="flex flex-col xs:items-end text-[10px] sm:text-xs opacity-90">
                <span>v{currentDoc.version}</span>
                <span>Updated: {currentDoc.lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 sm:mb-6 no-print">
          <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body p-2 sm:p-3 text-center">
              <FaLock className="mx-auto text-error text-sm sm:text-base" />
              <p className="text-[10px] sm:text-xs font-medium truncate">256-bit Encryption</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body p-2 sm:p-3 text-center">
              <FaCheckCircle className="mx-auto text-success text-sm sm:text-base" />
              <p className="text-[10px] sm:text-xs font-medium truncate">GDPR Compliant</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body p-2 sm:p-3 text-center">
              <FaShieldAlt className="mx-auto text-primary text-sm sm:text-base" />
              <p className="text-[10px] sm:text-xs font-medium truncate">HIPAA Ready</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body p-2 sm:p-3 text-center">
              <FaBalanceScale className="mx-auto text-secondary text-sm sm:text-base" />
              <p className="text-[10px] sm:text-xs font-medium truncate">Legal Compliance</p>
            </div>
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-2 sm:space-y-3">
          {currentSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections[section.id];

            return (
              <div
                key={section.id}
                id={section.id}
                className={`card bg-base-100 shadow-sm border border-base-200 transition-all ${isExpanded ? "ring-1 ring-error/20" : "hover:shadow-md"
                  }`}
              >
                {/* Section Header */}
                <div
                  onClick={() => toggleSection(section.id)}
                  className="card-body p-3 sm:p-4 cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                    <div className={`p-1.5 sm:p-2 rounded-lg ${isExpanded ? "bg-error/10" : "bg-base-200"
                      }`}>
                      <Icon className={`text-sm sm:text-base ${isExpanded ? "text-error" : "text-base-content/60"
                        }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base md:text-lg">
                        {section.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-base-content/60">
                        Last updated: {section.lastUpdated}
                      </p>
                    </div>

                    {/* Expand/Collapse Icon */}
                    <div className="ml-auto">
                      {isExpanded ? (
                        <FaChevronUp className="text-xs sm:text-sm text-error" />
                      ) : (
                        <FaChevronDown className="text-xs sm:text-sm text-base-content/40" />
                      )}
                    </div>
                  </div>

                  {/* Preview when collapsed */}
                  {!isExpanded && (
                    <div className="mt-2 text-xs text-base-content/60 line-clamp-1 pl-8 sm:pl-10">
                      {section.content.substring(0, 80)}...
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                    <div className="border-t border-base-200 pt-3 sm:pt-4">
                      <p className="text-xs sm:text-sm md:text-base opacity-80 leading-relaxed mb-3 sm:mb-4">
                        {section.content}
                      </p>

                      {/* Highlights */}
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {section.highlights.map((highlight, idx) => (
                          <span
                            key={idx}
                            className="badge badge-outline badge-xs sm:badge-sm gap-1 py-1 sm:py-1.5"
                          >
                            <FaCheckCircle className="text-success text-[8px] sm:text-xs" />
                            <span className="text-[8px] sm:text-xs">{highlight}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Summary */}
        <div className="alert alert-info shadow-lg mt-4 sm:mt-6 no-print">
          <FaExclamationTriangle className="shrink-0 text-xs sm:text-sm" />
          <div className="text-[10px] sm:text-xs md:text-sm">
            <h3 className="font-bold">Quick Summary</h3>
            <p className="opacity-90">
              By using BloodConnect, you agree to our {currentDoc.title}.
              For specific questions, contact our legal team.
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="card bg-neutral text-neutral-content mt-6 sm:mt-8 md:mt-10 shadow-xl no-print">
          <div className="card-body p-4 sm:p-5 md:p-6">
            <div className="text-center mb-3 sm:mb-4">
              <div className="avatar placeholder mb-2">
                <div className="bg-neutral-focus rounded-full w-8 sm:w-10 md:w-12">
                  <FaQuestionCircle className="text-sm sm:text-base md:text-lg" />
                </div>
              </div>
              <h2 className="card-title justify-center text-sm sm:text-base md:text-lg">
                Questions About Our Policies?
              </h2>
              <p className="text-xs sm:text-sm opacity-90">
                Our legal team is here to help 24/7
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 p-2 bg-base-100/10 rounded-lg">
                <FaEnvelope className="text-error shrink-0" />
                <span className="truncate">legal@bloodconnect.com</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-base-100/10 rounded-lg">
                <FaPhone className="text-error shrink-0" />
                <span>+1 (800) 123-4567</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-base-100/10 rounded-lg">
                <FaMapMarkerAlt className="text-error shrink-0" />
                <span className="truncate">123 Blood Drive, NY</span>
              </div>
            </div>

            {/* Live Chat Button */}
            <div className="flex justify-center mt-4">
              <button className="btn btn-error btn-sm sm:btn-md gap-2">
                <FaComments className="text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm">Start Live Chat</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col xs:flex-row items-center justify-between gap-2 text-[8px] sm:text-xs opacity-60 mt-4 sm:mt-6 no-print">
          <div className="flex items-center gap-1 sm:gap-2">
            <FaShieldAlt className="text-error" />
            <span>End-to-end encryption</span>
          </div>
          <div className="flex gap-2 sm:gap-4">
            <button className="hover:underline">Cookie Policy</button>
            <button className="hover:underline">GDPR</button>
            <button className="hover:underline">CCPA</button>
          </div>
        </div>

        {/* Scroll To Top Button */}
        {showScrollTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="btn btn-circle btn-error fixed bottom-4 sm:bottom-6 right-4 sm:right-6 shadow-lg hover:shadow-xl transition-all z-50 no-print"
          >
            <FaChevronUp />
          </button>
        )}
      </div>
    </div>
  );
};

export default TermsPrivacy;