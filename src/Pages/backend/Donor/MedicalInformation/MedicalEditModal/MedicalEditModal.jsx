// Pages/backend/Donor/MedicalInformation/MedicalEditModal/MedicalEditModal.jsx

/**
 * MedicalEditModal Component
 * 
 * A multi-step modal form for editing donor medical information.
 * Features:
 * - 4-step wizard interface with progress tracking
 * - Pre-populated form data from existing medical info
 * - Medical history collection with quick-select options
 * - Responsive design for mobile/tablet/desktop
 * - SweetAlert2 integration for success/error notifications
 * - Framer Motion animations for smooth transitions
 * 
 * @component
 * @param {Object} props
 * @param {boolean} props.saving - Loading state during save
 * @param {Function} props.closeModal - Function to close the modal
 * @param {Function} props.onSave - Save handler function
 * @param {number} props.modalKey - Key to reset modal state
 * @param {Object} props.initialForm - Initial form values
 * @param {Array} props.initialDiseases - Initial diseases list
 * @param {Array} props.initialAllergies - Initial allergies list
 * @param {Array} props.initialMedications - Initial medications list
 * @param {Array} props.bloodTypes - Available blood types
 * @param {Array} props.rhFactors - Available Rh factors
 * @param {Array} props.commonDiseases - Common diseases for quick select
 * @param {Array} props.commonAllergies - Common allergies for quick select
 * @param {Array} props.commonMedications - Common medications for quick select
 */

// React and Core Libraries
import React, { useEffect, useState } from "react";

// Animation
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// UI Components
import Swal from "sweetalert2";

// Icons - Organized by category for better maintainability
import {
  // Blood/Medical icons
  FaTint,           // Blood drop - primary icon
  FaHeartbeat,      // Heartbeat - hemoglobin
  FaFlask,          // Flask - Rh factor
  FaStethoscope,    // Stethoscope - medical conditions
  FaPills,          // Pills - allergies
  FaShieldAlt,      // Shield - medications

  // Action icons
  FaTimes,          // Close modal
  FaEdit,           // Edit icon
  FaCheckCircle,    // Success/confirmation
  FaExclamationCircle, // Error/warning
  FaClock,          // Time/eligibility

  // Status icons
  FaSave,           // Save changes
} from "react-icons/fa";

import { FiEdit3 } from "react-icons/fi";

const MedicalEditModal = ({
  saving,
  closeModal,
  onSave,
  modalKey,
  initialForm,
  initialDiseases,
  initialAllergies,
  initialMedications,
  bloodTypes,
  rhFactors,
  commonDiseases,
  commonAllergies,
  commonMedications,
}) => {
  // ==========================================================================
  // State Management
  // ==========================================================================

  // UI States
  const [step, setStep] = useState(1);                // Current step (1-4)
  const [isMobile, setIsMobile] = useState(false);    // Responsive detection
  const [apiError, setApiError] = useState("");       // Error messages

  // Form State
  const [form, setForm] = useState({
    bloodType: "",
    rhFactor: "",
    hemoglobin: "",
  });

  // Medical History States - Separate for better organization
  const [diseases, setDiseases] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [medications, setMedications] = useState([]);

  // Input field states for medical history
  const [newDisease, setNewDisease] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [newMedication, setNewMedication] = useState("");

  // ==========================================================================
  // Responsive Design Detection
  // ==========================================================================

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ==========================================================================
  // Initialize Form with Data
  // ==========================================================================

  useEffect(() => {
    // Reset to step 1 when modal opens
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep(1);
    setApiError("");

    // Set form values from props
    setForm(initialForm || { bloodType: "", rhFactor: "", hemoglobin: "" });
    setDiseases(Array.isArray(initialDiseases) ? initialDiseases : []);
    setAllergies(Array.isArray(initialAllergies) ? initialAllergies : []);
    setMedications(Array.isArray(initialMedications) ? initialMedications : []);

    // Clear input fields
    setNewDisease("");
    setNewAllergy("");
    setNewMedication("");
  }, [modalKey, initialForm, initialDiseases, initialAllergies, initialMedications]);

  // ==========================================================================
  // Animation Variants
  // ==========================================================================

  const stepVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  // ==========================================================================
  // Form Change Handlers
  // ==========================================================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setApiError(""); // Clear any previous errors
  };

  // ==========================================================================
  // Medical History Handlers
  // ==========================================================================

  /**
   * Adds a new disease to the list
   */
  const handleAddDisease = () => {
    if (newDisease.trim() && !diseases.includes(newDisease.trim())) {
      setDiseases([...diseases, newDisease.trim()]);
      setNewDisease("");
    }
  };

  /**
   * Adds a new allergy to the list
   */
  const handleAddAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  /**
   * Adds a new medication to the list
   */
  const handleAddMedication = () => {
    if (newMedication.trim() && !medications.includes(newMedication.trim())) {
      setMedications([...medications, newMedication.trim()]);
      setNewMedication("");
    }
  };

  /**
   * Toggles disease selection from quick-select buttons
   */
  const handleQuickSelectDisease = (disease) => {
    if (diseases.includes(disease)) {
      setDiseases(diseases.filter(d => d !== disease));
    } else {
      setDiseases([...diseases, disease]);
    }
  };

  /**
   * Toggles allergy selection from quick-select buttons
   */
  const handleQuickSelectAllergy = (allergy) => {
    if (allergies.includes(allergy)) {
      setAllergies(allergies.filter(a => a !== allergy));
    } else {
      setAllergies([...allergies, allergy]);
    }
  };

  /**
   * Toggles medication selection from quick-select buttons
   */
  const handleQuickSelectMedication = (med) => {
    if (medications.includes(med)) {
      setMedications(medications.filter(m => m !== med));
    } else {
      setMedications([...medications, med]);
    }
  };

  /**
   * Removes a disease from the list
   */
  const removeDisease = (index) => {
    setDiseases(diseases.filter((_, i) => i !== index));
  };

  /**
   * Removes an allergy from the list
   */
  const removeAllergy = (index) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  /**
   * Removes a medication from the list
   */
  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  // ==========================================================================
  // Navigation Handlers
  // ==========================================================================

  /**
   * Navigates to next step after validation
   */
  const nextStep = () => {
    setApiError("");

    if (step === 1) {
      // Validate blood info
      if (!form.bloodType || !form.rhFactor || !form.hemoglobin) {
        setApiError("Please fill in all blood information fields");
        return;
      }
    }
    setStep(step + 1);
  };

  /**
   * Navigates to previous step
   */
  const prevStep = () => {
    setApiError("");
    setStep(step - 1);
  };

  /**
   * Handles cancel button click
   */
  const handleCancel = () => {
    // Check if there are unsaved changes
    const hasChanges =
      form.bloodType !== (initialForm?.bloodType || "") ||
      form.rhFactor !== (initialForm?.rhFactor || "") ||
      form.hemoglobin !== (initialForm?.hemoglobin || "") ||
      JSON.stringify(diseases) !== JSON.stringify(initialDiseases) ||
      JSON.stringify(allergies) !== JSON.stringify(initialAllergies) ||
      JSON.stringify(medications) !== JSON.stringify(initialMedications);

    if (hasChanges) {
      Swal.fire({
        title: 'Unsaved Changes',
        text: 'You have unsaved changes. Are you sure you want to close?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, close',
        cancelButtonText: 'Stay',
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      }).then((result) => {
        if (result.isConfirmed) {
          closeModal();
        }
      });
    } else {
      closeModal();
    }
  };

  // ==========================================================================
  // Form Submission
  // ==========================================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    try {
      const ok = await onSave({
        form,
        diseases,
        allergies,
        medications,
      });

      if (ok) {
        closeModal();
      }
    } catch (error) {
      setApiError(error.message || "Failed to save medical information");
    }
  };

  // ==========================================================================
  // Render Component
  // ==========================================================================

  return (
    <div className={`
      ${isMobile ? 'w-full max-w-full h-full rounded-none' : 'modal-box w-11/12 max-w-2xl'} 
      p-0 overflow-hidden bg-base-100
    `}>
      {/* Header Section - Always visible */}
      <div className="bg-linear-to-r from-warning to-warning/80 p-4 md:p-6 text-white">
        <div className="flex justify-between items-start md:items-center">
          {/* Title with icon */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-white/20 p-2 md:p-3 rounded-full">
              <FiEdit3 size={isMobile ? 20 : 24} />
            </div>
            <div>
              <h3 className="font-bold text-xl md:text-2xl">
                {isMobile ? 'Edit Medical' : 'Edit Medical Information'}
              </h3>
              <p className="text-white/80 text-xs md:text-sm">
                Update your medical details
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleCancel}
            type="button"
            className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>
      </div>

      {/* Progress Steps - Responsive design */}
      <div className="px-4 md:px-6 pt-4 md:pt-6">
        <div className="steps steps-horizontal w-full text-xs md:text-sm">
          <div className={`step ${step >= 1 ? "step-warning" : ""}`}>
            {isMobile ? 'Blood' : 'Blood Info'}
          </div>
          <div className={`step ${step >= 2 ? "step-warning" : ""}`}>
            {isMobile ? 'Conditions' : 'Medical Conditions'}
          </div>
          <div className={`step ${step >= 3 ? "step-warning" : ""}`}>
            {isMobile ? 'Allergies' : "Allergies & Med's"}
          </div>
          <div className={`step ${step >= 4 ? "step-warning" : ""}`}>
            {isMobile ? 'Review' : 'Review & Update'}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {apiError && (
        <div className="px-4 md:px-6 pt-4">
          <div className="alert alert-error shadow-lg">
            <div className="flex items-center gap-2">
              <FaExclamationCircle size={20} />
              <span className="text-sm">{apiError}</span>
            </div>
          </div>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit}>
        {/* Main Content Area - Scrollable */}
        <div className={`
          p-4 md:p-6 
          ${isMobile ? 'max-h-[calc(100vh-250px)]' : 'max-h-[60vh]'} 
          overflow-y-auto
        `}>
          {/* Animated Step Container */}
          <AnimatePresence mode="wait" custom={step}>
            {/* Step 1: Blood Information */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={1}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="font-semibold flex items-center gap-2 text-base md:text-lg">
                  <FaTint className="text-warning" />
                  Blood Information
                </h3>

                {/* Blood Type Selection - Grid responsive */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaTint className="text-warning" /> Blood Type
                    </span>
                  </label>
                  <div className="grid grid-cols-4 gap-1 md:gap-2">
                    {bloodTypes.map((type) => (
                      <label key={type} className="cursor-pointer">
                        <input
                          type="radio"
                          name="bloodType"
                          value={type}
                          className="hidden"
                          checked={form.bloodType === type}
                          onChange={handleChange}
                        />
                        <div
                          className={`
                            btn btn-xs md:btn-sm w-full
                            ${form.bloodType === type
                              ? "btn-warning text-white"
                              : "btn-outline btn-warning"
                            }
                          `}
                        >
                          {type}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rh Factor Selection */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaFlask className="text-warning" /> Rh Factor
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {rhFactors.map((factor) => (
                      <label key={factor} className="cursor-pointer">
                        <input
                          type="radio"
                          name="rhFactor"
                          value={factor}
                          className="hidden"
                          checked={form.rhFactor === factor}
                          onChange={handleChange}
                        />
                        <div
                          className={`
                            btn btn-sm w-full
                            ${form.rhFactor === factor
                              ? "btn-warning text-white"
                              : "btn-outline btn-warning"
                            }
                          `}
                        >
                          {factor === "positive" ? "Positive (+)" : "Negative (-)"}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Hemoglobin Level Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaHeartbeat className="text-warning" /> Hemoglobin (g/dL)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="5"
                    max="20"
                    name="hemoglobin"
                    className={`
                      input input-bordered w-full
                      ${isMobile ? 'input-sm' : ''}
                    `}
                    value={form.hemoglobin}
                    onChange={handleChange}
                    placeholder="e.g. 13.5"
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      Minimum: 12.5 g/dL (women), 13.5 g/dL (men)
                    </span>
                  </label>
                </div>
              </motion.div>
            )}

            {/* Step 2: Medical Conditions */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={2}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="font-semibold flex items-center gap-2 text-base md:text-lg">
                  <FaStethoscope className="text-warning" />
                  Medical Conditions
                </h3>

                {/* Info Alert */}
                <div className="alert alert-info bg-info/10 border-info/20">
                  <FaStethoscope className="text-info" />
                  <span className="text-xs text-primary md:text-sm">
                    Select any medical conditions you have (optional)
                  </span>
                </div>

                <div className="form-control">
                  {/* Quick Select Buttons - Responsive grid */}
                  <div className="flex flex-wrap gap-1 md:gap-2">
                    {commonDiseases.map((disease) => (
                      <button
                        key={disease}
                        type="button"
                        onClick={() => handleQuickSelectDisease(disease)}
                        className={`
                          btn btn-xs md:btn-sm
                          ${diseases.includes(disease)
                            ? "btn-warning text-white"
                            : "btn-outline btn-warning"
                          }
                        `}
                      >
                        {disease}
                      </button>
                    ))}
                  </div>

                  {/* Custom Input */}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={newDisease}
                      onChange={(e) => setNewDisease(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddDisease()}
                      placeholder="Add other condition"
                      className="input input-bordered input-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddDisease}
                      className="btn btn-sm btn-warning"
                      disabled={!newDisease.trim()}
                    >
                      Add
                    </button>
                  </div>

                  {/* Selected Items Display */}
                  {diseases.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-3">
                      {diseases.map((disease, i) => (
                        <span key={i} className="badge badge-warning gap-1 p-2">
                          {disease}
                          <button
                            type="button"
                            onClick={() => removeDisease(i)}
                            className="ml-1 hover:text-white"
                          >
                            <FaTimes size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Allergies & Medications */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={3}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Allergies Section */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaPills className="text-warning" /> Allergies
                    </span>
                  </label>

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap gap-1 md:gap-2">
                    {commonAllergies.map((allergy) => (
                      <button
                        key={allergy}
                        type="button"
                        onClick={() => handleQuickSelectAllergy(allergy)}
                        className={`
                          btn btn-xs md:btn-sm
                          ${allergies.includes(allergy)
                            ? "btn-warning text-white"
                            : "btn-outline btn-warning"
                          }
                        `}
                      >
                        {allergy}
                      </button>
                    ))}
                  </div>

                  {/* Custom Input */}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy()}
                      placeholder="Add other allergy"
                      className="input input-bordered input-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddAllergy}
                      className="btn btn-sm btn-warning"
                      disabled={!newAllergy.trim()}
                    >
                      Add
                    </button>
                  </div>

                  {/* Selected Items Display */}
                  {allergies.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-3">
                      {allergies.map((allergy, i) => (
                        <span key={i} className="badge badge-warning gap-1 p-2">
                          {allergy}
                          <button
                            type="button"
                            onClick={() => removeAllergy(i)}
                            className="ml-1 hover:text-white"
                          >
                            <FaTimes size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Medications Section */}
                <div className="form-control pt-4 border-t border-base-300">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaShieldAlt className="text-warning" /> Current Medications
                    </span>
                  </label>

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap gap-1 md:gap-2">
                    {commonMedications.map((med) => (
                      <button
                        key={med}
                        type="button"
                        onClick={() => handleQuickSelectMedication(med)}
                        className={`
                          btn btn-xs md:btn-sm
                          ${medications.includes(med)
                            ? "btn-warning text-white"
                            : "btn-outline btn-warning"
                          }
                        `}
                      >
                        {med}
                      </button>
                    ))}
                  </div>

                  {/* Custom Input */}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={newMedication}
                      onChange={(e) => setNewMedication(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddMedication()}
                      placeholder="Add other medication"
                      className="input input-bordered input-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddMedication}
                      className="btn btn-sm btn-warning"
                      disabled={!newMedication.trim()}
                    >
                      Add
                    </button>
                  </div>

                  {/* Selected Items Display */}
                  {medications.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-3">
                      {medications.map((med, i) => (
                        <span key={i} className="badge badge-warning gap-1 p-2">
                          {med}
                          <button
                            type="button"
                            onClick={() => removeMedication(i)}
                            className="ml-1 hover:text-white"
                          >
                            <FaTimes size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 4: Review & Update */}
            {step === 4 && (
              <motion.div
                key="step4"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={4}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Review Info Alert */}
                <div className="alert alert-warning bg-warning/10 border-warning/20">
                  <FaCheckCircle className="text-warning" />
                  <span className="text-xs md:text-sm text-warning">
                    Please review your updated information before saving.
                  </span>
                </div>

                {/* Blood Information Review Card */}
                <div className="bg-base-200 rounded-lg p-3 md:p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                    <FaTint className="text-warning" />
                    Blood Information
                  </h4>
                  <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 md:gap-3 text-xs md:text-sm">
                    <div className="flex xs:block justify-between">
                      <p className="opacity-70 xs:mb-1">Blood Type</p>
                      <p className="font-medium text-warning">{form.bloodType || "Not set"}</p>
                    </div>
                    <div className="flex xs:block justify-between">
                      <p className="opacity-70 xs:mb-1">Rh Factor</p>
                      <p className="font-medium">
                        {form.rhFactor === "positive" ? "Positive (+)" :
                          form.rhFactor === "negative" ? "Negative (-)" : "Not set"}
                      </p>
                    </div>
                    <div className="flex xs:block justify-between">
                      <p className="opacity-70 xs:mb-1">Hemoglobin</p>
                      <p className="font-medium">{form.hemoglobin || "Not set"} g/dL</p>
                    </div>
                  </div>
                </div>

                {/* Medical History Review Card */}
                <div className="bg-base-200 rounded-lg p-3 md:p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                    <FaStethoscope className="text-warning" />
                    Medical History
                  </h4>
                  <div className="text-xs md:text-sm space-y-2">
                    <div>
                      <p className="opacity-70 mb-1">Medical Conditions</p>
                      <div className="flex flex-wrap gap-1">
                        {diseases.length > 0 ? (
                          diseases.map((disease, i) => (
                            <span key={i} className="badge badge-warning badge-sm">{disease}</span>
                          ))
                        ) : (
                          <span className="text-xs opacity-50">None reported</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="opacity-70 mb-1">Allergies</p>
                      <div className="flex flex-wrap gap-1">
                        {allergies.length > 0 ? (
                          allergies.map((allergy, i) => (
                            <span key={i} className="badge badge-warning badge-sm">{allergy}</span>
                          ))
                        ) : (
                          <span className="text-xs opacity-50">None reported</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="opacity-70 mb-1">Medications</p>
                      <div className="flex flex-wrap gap-1">
                        {medications.length > 0 ? (
                          medications.map((med, i) => (
                            <span key={i} className="badge badge-warning badge-sm">{med}</span>
                          ))
                        ) : (
                          <span className="text-xs opacity-50">None reported</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Update Note */}
                <div className="text-xs text-base-content/60 text-center flex items-center justify-center gap-1">
                  <FaClock className="inline" />
                  This information helps ensure safe donations for both you and recipients
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions - Responsive buttons */}
        <div className="modal-action border-t border-base-300 p-3 md:p-4 bg-base-200/50">
          <div className="flex justify-between w-full gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline btn-warning btn-sm md:btn-md"
              >
                Previous
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-warning text-white btn-sm md:btn-md ml-auto"
              >
                Next
              </button>
            ) : (
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-ghost btn-sm md:btn-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-warning text-white btn-sm md:btn-md gap-2"
                >
                  {saving ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      {isMobile ? 'Saving...' : 'Saving Changes...'}
                    </>
                  ) : (
                    <>
                      <FaSave />
                      {isMobile ? 'Save' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default MedicalEditModal;