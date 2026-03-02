// Pages/backend/Donor/DonorProfile/EditDonorModal/EditDonorModal.jsx

/**
 * EditDonorModal Component
 * 
 * A multi-step modal form for editing an existing blood donor profile.
 * Features:
 * - 4-step wizard interface with progress tracking
 * - Pre-populated form data from existing donor profile
 * - Form validation using react-hook-form
 * - Medical history collection with quick-select options
 * - Responsive design for mobile/tablet/desktop
 * - SweetAlert2 integration for success/error notifications
 * - Framer Motion animations for smooth transitions
 * 
 * @component
 * @param {Object} props
 * @param {string} props.donorId - ID of the donor to edit
 * @param {Object} props.donorData - Optional pre-fetched donor data
 * @param {Function} props.refreshDonors - Callback to refresh donor list after update
 * @param {Function} props.onSuccess - Callback when modal closes successfully
 */

// React and Core Libraries
import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";

// Animation
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// UI Components
import Swal from "sweetalert2";

// Icons - Organized by category for better maintainability
import {
  // Blood/Medical icons
  FaTint,           // Blood drop - primary icon
  FaHeartbeat,      // Heartbeat - hemoglobin, donation types
  FaFlask,          // Flask - Rh factor, plasma donation
  FaStethoscope,    // Stethoscope - medical history
  FaPills,          // Pills - allergies
  FaShieldAlt,      // Shield - medications

  // Location/Preferences icons
  FaMapMarkerAlt,   // Map marker - travel distance
  FaClock,          // Clock - timing/eligibility

  // Action icons
  FaTimes,          // Close modal
  FaEdit,           // Edit icon
  FaCheckCircle,    // Success/confirmation
  FaExclamationCircle, // Error/warning

  // Status icons
  FaSave,           // Save changes
} from "react-icons/fa";

// Custom Hooks
import useAuth from "../../../../../hooks/useAuth";
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

// Shared Components
import BloodLoader from "../../../../../shared/BloodLoader";

const EditDonorModal = ({ donorId, donorData, refreshDonors, onSuccess }) => {
  // ==========================================================================
  // Hooks and Initialization
  // ==========================================================================

  const { axiosInstance } = useAxiosPublic();
  const { loading: authLoading } = useAuth();
  const token = localStorage.getItem("auth_token");

  // ==========================================================================
  // State Management
  // ==========================================================================

  // UI States
  const [step, setStep] = useState(1);                // Current step (1-4)
  const [apiError, setApiError] = useState("");       // API error messages
  const [loading, setLoading] = useState(false);      // Form submission loading
  const [isMobile, setIsMobile] = useState(false);    // Responsive detection
  const [fetchLoading, setFetchLoading] = useState(false); // Data fetching loading
  const [dataFetched, setDataFetched] = useState(false); // Track if data was fetched

  // Medical History States - Separate for better organization
  const [diseases, setDiseases] = useState([]);       // Medical conditions
  const [allergies, setAllergies] = useState([]);     // Allergies
  const [medications, setMedications] = useState([]); // Current medications

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
  // Form Configuration
  // ==========================================================================

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    trigger,
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      bloodGroup: "",
      rhFactor: "",
      hemoglobin: "",
      donationType: [],
      maxDistance: 50,
      emergencyDonor: false,
      notifyForEmergency: true,
      isActive: true,
    },
  });

  // ==========================================================================
  // Watched Values
  // ==========================================================================

  const maxDistance = watch("maxDistance");
  const selectedRhFactor = watch("rhFactor");
  const selectedBloodGroup = watch("bloodGroup");
  const selectedDonationType = watch("donationType");

  // ==========================================================================
  // Constants and Configuration
  // ==========================================================================

  // Blood type options with display properties
  const bloodTypes = [
    { value: "A+", group: "A", rh: "+" },
    { value: "A-", group: "A", rh: "-" },
    { value: "B+", group: "B", rh: "+" },
    { value: "B-", group: "B", rh: "-" },
    { value: "AB+", group: "AB", rh: "+" },
    { value: "AB-", group: "AB", rh: "-" },
    { value: "O+", group: "O", rh: "+" },
    { value: "O-", group: "O", rh: "-" },
  ];

  // Rh factor options
  const rhFactors = [
    { value: "positive", label: "Positive (+)" },
    { value: "negative", label: "Negative (-)" },
  ];

  // Donation types with detailed descriptions for better UX
  const donationTypes = [
    {
      value: "whole_blood",
      label: "Whole Blood",
      icon: FaTint,
      description: "Standard whole blood donation (450ml)",
      requirements: "Every 56 days",
      duration: "10-15 minutes"
    },
    {
      value: "plasma",
      label: "Plasma",
      icon: FaFlask,
      description: "Plasma donation via apheresis",
      requirements: "Every 28 days",
      duration: "45-60 minutes"
    },
    {
      value: "platelets",
      label: "Platelets",
      icon: FaHeartbeat,
      description: "Platelet donation via apheresis",
      requirements: "Every 7 days",
      duration: "60-90 minutes"
    },
  ];

  // Medical quick-select options for common conditions
  const commonDiseases = [
    "Diabetes", "Hypertension", "Asthma", "Thyroid",
    "Heart Disease", "Hepatitis B", "Hepatitis C", "Cancer"
  ];

  const commonAllergies = [
    "Pollen", "Dust", "Penicillin", "Latex", "Sulfa",
    "Ibuprofen", "Aspirin", "Shellfish"
  ];

  const commonMedications = [
    "Aspirin", "Ibuprofen", "Antihistamines", "Insulin",
    "Blood Thinners", "Antibiotics", "Antidepressants"
  ];

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
  // Data Population
  // ==========================================================================

  /**
   * Populates form fields with donor data
   * @param {Object} donor - Donor data object
   */
  const populateFormData = useCallback((donor) => {
    if (!donor) return;

    // Set form values from donor data
    setValue("rhFactor", donor.medicalInfo?.rhFactor || "");
    setValue("bloodGroup", donor.medicalInfo?.bloodType || "");
    setValue("hemoglobin", donor.medicalInfo?.hemoglobin || "");
    setValue("isActive", donor.donationPreferences?.isActive !== false);
    setValue("maxDistance", donor.donationPreferences?.maxDistance || 50);
    setValue("emergencyDonor", donor.donationPreferences?.emergencyDonor || false);
    setValue("donationType", donor.donationPreferences?.donationType || ["whole_blood"]);
    setValue("notifyForEmergency", donor.donationPreferences?.notifyForEmergency !== false);

    // Set medical history arrays
    setDiseases(donor.medicalInfo?.diseases || []);
    setAllergies(donor.medicalInfo?.allergies || []);
    setMedications(donor.medicalInfo?.medications || []);

    setDataFetched(true);
  }, [setValue]);

  /**
   * Fetches donor data from API if not provided directly
   */
  const fetchDonorData = useCallback(async () => {
    if (!donorId) {
      setApiError("Donor ID is missing");
      setFetchLoading(false);
      return;
    }

    setFetchLoading(true);
    setApiError("");

    try {
      const token = localStorage.getItem("auth_token");
      const response = await axiosInstance.get(`/donors/${donorId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.data.success) {
        const donor = response.data.data;
        populateFormData(donor);
      }
    } catch (error) {
      console.error("Failed to fetch donor data:", error);

      // Handle different error types
      if (error.response?.status === 401) {
        setApiError("Authentication failed. Please log in again.");
      } else if (error.response?.status === 403) {
        setApiError("You don't have permission to view this profile.");
      } else if (error.response?.status === 404) {
        setApiError("Donor profile not found.");
      } else {
        setApiError(error.response?.data?.error || "Failed to load donor data. Please try again.");
      }
    } finally {
      setFetchLoading(false);
    }
  }, [axiosInstance, donorId, populateFormData]);

  // Fetch donor data if not provided directly
  useEffect(() => {
    if (donorData) {
      populateFormData(donorData);
      return;
    }
    fetchDonorData();
  }, [donorData, fetchDonorData, populateFormData]);

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Closes the modal and resets all form states
   * @param {boolean} shouldRefresh - Whether to trigger refresh callback
   */
  const closeModal = (shouldRefresh = false) => {
    reset();
    setStep(1);
    setApiError("");
    setDiseases([]);
    setAllergies([]);
    setMedications([]);
    setNewDisease("");
    setNewAllergy("");
    setNewMedication("");
    setDataFetched(false);

    const modal = document.getElementById('edit_donor_modal');
    if (modal) modal.close();

    if (shouldRefresh && onSuccess) onSuccess();
  };

  /**
   * Navigates to next step after validation
   */
  const nextStep = async () => {
    setApiError("");
    let fieldsToValidate = [];

    // Define which fields to validate per step
    switch (step) {
      case 1:
        fieldsToValidate = ["bloodGroup", "rhFactor", "hemoglobin"];
        break;
      case 2:
        fieldsToValidate = ["donationType", "maxDistance"];
        break;
      case 3:
        fieldsToValidate = []; // Medical history is optional
        break;
      default:
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
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
    if (isDirty || diseases.length > 0 || allergies.length > 0 || medications.length > 0) {
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

  // ==========================================================================
  // Form Submission
  // ==========================================================================

  /**
   * Handles final form submission
   * Updates donor profile via API
   */
  const onSubmit = async (data) => {
    if (!donorId) {
      setApiError("Donor ID is missing. Please refresh and try again.");
      return;
    }

    setLoading(true);
    setApiError("");

    // Parse and validate numeric values
    const hemoglobinValue = data.hemoglobin ? parseFloat(data.hemoglobin) : null;

    // Structure data according to backend expectations
    const donorUpdateData = {
      medicalInfo: {
        bloodType: data.bloodGroup,
        rhFactor: data.rhFactor || null,
        hemoglobin: hemoglobinValue,
        diseases: diseases,
        allergies: allergies,
        medications: medications,
      },
      donationPreferences: {
        isActive: data.isActive,
        donationType: Array.isArray(data.donationType) ? data.donationType : [data.donationType],
        maxDistance: parseInt(data.maxDistance, 10),
        emergencyDonor: data.emergencyDonor,
        notifyForEmergency: data.notifyForEmergency,
      }
    };

    try {
      const response = await axiosInstance.put(`/donors/${donorId}`, donorUpdateData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.data.success) {
        closeModal(true);

        // Refresh donor list if callback provided
        if (refreshDonors) {
          refreshDonors();
        }

        // Show success message with theme-aware styling
        await Swal.fire({
          title: "Profile Updated! 🎉",
          html: `
            <div class="text-center">
              <p class="mb-2">Your donor profile has been updated successfully.</p>
              <p class="text-sm text-base-content/70">You are still eligible to donate blood and save lives!</p>
              <div class="mt-4 p-3 bg-warning/10 rounded-lg">
                <p class="text-xs font-semibold text-warning">Changes Saved:</p>
                <p class="text-xs mt-1">Your updated information is now active.</p>
              </div>
            </div>
          `,
          icon: "success",
          confirmButtonColor: "#f59e0b",
          confirmButtonText: "Great!",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        });
      }
    } catch (error) {
      console.error("Failed to update donor profile:", error);

      // Handle different error types
      if (error.response?.status === 401) {
        setApiError("Authentication failed. Please log in again.");
      } else if (error.response?.status === 403) {
        setApiError("You don't have permission to edit this profile.");
      } else if (error.response?.status === 404) {
        setApiError("Donor profile not found.");
      } else {
        setApiError(error.response?.data?.error || "Failed to update donor profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // Loading State
  // ==========================================================================

  if (authLoading || fetchLoading) return <BloodLoader fullscreen={false} />;

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
        <div className="flex justify-between items-center">
          {/* Title with icon */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-white/20 p-2 md:p-3 rounded-full">
              <FaEdit size={isMobile ? 20 : 24} />
            </div>
            <div>
              <h3 className="font-bold text-xl md:text-2xl">
                {isMobile ? 'Edit Donor' : 'Edit Donor Profile'}
              </h3>
              <p className="text-white/80 text-xs md:text-sm">
                Update your donor information
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
            {isMobile ? 'Pref' : 'Preferences'}
          </div>
          <div className={`step ${step >= 3 ? "step-warning" : ""}`}>
            {isMobile ? 'Medical' : 'Medical History'}
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
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Main Content Area - Scrollable */}
        <div className={`
          p-4 md:p-6 
          ${isMobile ? 'max-h-[calc(100vh-250px)]' : 'max-h-[60vh]'} 
          overflow-y-auto
        `}>
          {/* Loading indicator while populating data */}
          {!dataFetched && !donorData && (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-lg text-warning"></span>
            </div>
          )}

          {/* Animated Step Container */}
          <AnimatePresence mode="wait" custom={step}>
            {/* Step 1: Blood Information */}
            {step === 1 && dataFetched && (
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
                {/* Blood Type Selection - Grid responsive */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaTint className="text-warning" /> Blood Type
                    </span>
                  </label>
                  <div className="grid grid-cols-4 gap-1 md:gap-2">
                    {bloodTypes.map((type) => (
                      <label key={type.value} className="cursor-pointer">
                        <input
                          type="radio"
                          value={type.value}
                          className="hidden"
                          {...register("bloodGroup", {
                            required: "Please select your blood type",
                          })}
                        />
                        <div
                          className={`
                            btn btn-xs md:btn-sm w-full
                            ${selectedBloodGroup === type.value
                              ? "btn-warning text-white"
                              : "btn-outline btn-warning"
                            }
                          `}
                        >
                          {type.value}
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.bloodGroup && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.bloodGroup.message}
                      </span>
                    </label>
                  )}
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
                      <label key={factor.value} className="cursor-pointer">
                        <input
                          type="radio"
                          value={factor.value}
                          className="hidden"
                          {...register("rhFactor", {
                            required: "Please select your Rh factor",
                          })}
                        />
                        <div
                          className={`
                            btn btn-sm w-full
                            ${selectedRhFactor === factor.value
                              ? "btn-warning text-white"
                              : "btn-outline btn-warning"
                            }
                          `}
                        >
                          {factor.label}
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.rhFactor && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.rhFactor.message}
                      </span>
                    </label>
                  )}
                </div>

                {/* Hemoglobin Level Input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaHeartbeat className="text-warning" /> Hemoglobin Level (g/dL)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    placeholder="Enter your hemoglobin level"
                    className={`
                      input input-bordered w-full
                      ${isMobile ? 'input-sm' : ''}
                      ${errors.hemoglobin ? "input-error" : ""}
                    `}
                    {...register("hemoglobin", {
                      required: "Hemoglobin level is required",
                      min: {
                        value: 5,
                        message: "Hemoglobin seems too low (minimum 5 g/dL)"
                      },
                      max: {
                        value: 20,
                        message: "Hemoglobin seems too high (maximum 20 g/dL)"
                      },
                    })}
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      Minimum: 12.5 g/dL (women), 13.5 g/dL (men)
                    </span>
                  </label>
                  {errors.hemoglobin && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.hemoglobin.message}
                      </span>
                    </label>
                  )}
                </div>

                {/* Data Source Indicator */}
                <div className="text-xs text-base-content/50 text-center mt-2">
                  <span className="badge badge-ghost badge-xs">Editing existing profile</span>
                </div>
              </motion.div>
            )}

            {/* Step 2: Donation Preferences */}
            {step === 2 && dataFetched && (
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
                {/* Donation Types Selection */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaHeartbeat className="text-warning" /> Donation Types
                    </span>
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {donationTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = selectedDonationType?.includes(type.value);
                      return (
                        <label
                          key={type.value}
                          className={`
                            flex items-center gap-2 md:gap-3 p-2 md:p-3 
                            rounded-lg border-2 cursor-pointer transition-all
                            ${isSelected
                              ? "border-warning bg-warning/10"
                              : "border-base-300 hover:border-warning/50"
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            value={type.value}
                            className="hidden"
                            {...register("donationType", {
                              required: "Please select at least one donation type",
                            })}
                          />
                          <Icon className={`
                            ${isMobile ? 'text-lg' : 'text-xl'}
                            ${isSelected ? "text-warning" : "text-gray-400"}
                          `} />
                          <div className="flex-1">
                            <p className={`font-semibold text-sm md:text-base ${isSelected ? "text-warning" : ""}`}>
                              {type.label}
                            </p>
                            <p className="text-xs opacity-70">{type.description}</p>
                            {!isMobile && (
                              <div className="flex gap-2 mt-1 text-xs opacity-60">
                                <span>⏱️ {type.duration}</span>
                                <span>📅 {type.requirements}</span>
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <FaCheckCircle className="text-warning" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                  {errors.donationType && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.donationType.message}
                      </span>
                    </label>
                  )}
                </div>

                {/* Maximum Travel Distance */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaMapMarkerAlt className="text-warning" />
                      {isMobile ? 'Max Distance' : 'Maximum Travel Distance'} (km)
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    className="range range-warning range-sm"
                    {...register("maxDistance")}
                  />
                  <div className="flex justify-between text-xs px-2 mt-1">
                    <span>0km</span>
                    <span className="font-bold text-warning">{maxDistance}km</span>
                    <span>200km</span>
                  </div>
                </div>

                {/* Emergency Donor Toggle */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-warning checkbox-sm md:checkbox-md"
                      {...register("emergencyDonor")}
                    />
                    <span className="label-text text-sm md:text-base">
                      Register as emergency donor
                    </span>
                  </label>
                  <p className="text-xs opacity-70 ml-8 md:ml-10">
                    Willing to donate in emergency situations when contacted directly
                  </p>
                </div>

                {/* Emergency Notifications Toggle */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-warning checkbox-sm md:checkbox-md"
                      {...register("notifyForEmergency")}
                    />
                    <span className="label-text text-sm md:text-base">
                      Receive emergency notifications
                    </span>
                  </label>
                  <p className="text-xs opacity-70 ml-8 md:ml-10">
                    Get notified when your blood type is urgently needed
                  </p>
                </div>

                {/* Active Status Toggle */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-warning checkbox-sm md:checkbox-md"
                      {...register("isActive")}
                    />
                    <span className="label-text text-sm md:text-base">
                      Active donor status
                    </span>
                  </label>
                  <p className="text-xs opacity-70 ml-8 md:ml-10">
                    Make your profile visible to blood banks and hospitals
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Medical History */}
            {step === 3 && dataFetched && (
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
                {/* Info Alert */}
                <div className="alert alert-info bg-info/10 border-info/20">
                  <FaStethoscope className="text-info" />
                  <span className="text-xs md:text-sm text-primary">
                    Update your medical history to ensure safe donations.
                  </span>
                </div>

                {/* Medical Conditions Section */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaStethoscope className="text-warning" /> Medical Conditions
                    </span>
                  </label>
                  <div className="space-y-2">
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
                    <div className="flex gap-2">
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
                  </div>

                  {/* Selected Items Display */}
                  {diseases.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {diseases.map((disease, i) => (
                        <span key={i} className="badge badge-warning gap-1 p-2">
                          {disease}
                          <button
                            type="button"
                            onClick={() => setDiseases(diseases.filter((_, index) => index !== i))}
                            className="ml-1 hover:text-white"
                          >
                            <FaTimes size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Allergies Section */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaPills className="text-warning" /> Allergies
                    </span>
                  </label>
                  <div className="space-y-2">
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
                    <div className="flex gap-2">
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
                  </div>

                  {/* Selected Items Display */}
                  {allergies.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {allergies.map((allergy, i) => (
                        <span key={i} className="badge badge-warning gap-1 p-2">
                          {allergy}
                          <button
                            type="button"
                            onClick={() => setAllergies(allergies.filter((_, index) => index !== i))}
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
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaShieldAlt className="text-warning" /> Current Medications
                    </span>
                  </label>
                  <div className="space-y-2">
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
                    <div className="flex gap-2">
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
                  </div>

                  {/* Selected Items Display */}
                  {medications.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {medications.map((med, i) => (
                        <span key={i} className="badge badge-warning gap-1 p-2">
                          {med}
                          <button
                            type="button"
                            onClick={() => setMedications(medications.filter((_, index) => index !== i))}
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
            {step === 4 && dataFetched && (
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
                    Please review your updated information before submitting.
                  </span>
                </div>

                {/* Blood Information Review Card */}
                <div className="bg-base-200 rounded-lg p-3 md:p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                    <FaTint className="text-warning" />
                    Blood Information
                  </h4>
                  <div className="grid grid-cols-3 gap-2 md:gap-3 text-xs md:text-sm">
                    <div>
                      <p className="opacity-70">Blood Type</p>
                      <p className="font-medium text-warning">{watch("bloodGroup") || "Not set"}</p>
                    </div>
                    <div>
                      <p className="opacity-70">Rh Factor</p>
                      <p className="font-medium">
                        {watch("rhFactor") === "positive" ? "Positive (+)" :
                          watch("rhFactor") === "negative" ? "Negative (-)" : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="opacity-70">Hemoglobin</p>
                      <p className="font-medium">{watch("hemoglobin") || "Not set"} g/dL</p>
                    </div>
                  </div>
                </div>

                {/* Donation Preferences Review Card */}
                <div className="bg-base-200 rounded-lg p-3 md:p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                    <FaHeartbeat className="text-warning" />
                    Donation Preferences
                  </h4>
                  <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                    <div>
                      <p className="opacity-70">Donation Types</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.isArray(watch("donationType")) && watch("donationType").length > 0 ? (
                          watch("donationType").map((type, i) => (
                            <span key={i} className="badge badge-warning badge-sm">
                              {type.replace("_", " ")}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs opacity-50">None selected</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="opacity-70">Max Distance</p>
                      <p className="font-medium">{watch("maxDistance")} km</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                    <div>
                      <p className="opacity-70">Emergency Donor</p>
                      <p className="font-medium">{watch("emergencyDonor") ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <p className="opacity-70">Emergency Notifications</p>
                      <p className="font-medium">{watch("notifyForEmergency") ? "Enabled" : "Disabled"}</p>
                    </div>
                  </div>
                  <div className="text-xs md:text-sm">
                    <p className="opacity-70">Active Status</p>
                    <p className="font-medium">{watch("isActive") ? "Active" : "Inactive"}</p>
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
                  Your eligibility settings will be preserved
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
                  disabled={loading}
                  className="btn btn-warning text-white btn-sm md:btn-md gap-2"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      {isMobile ? 'Updating...' : 'Updating Profile...'}
                    </>
                  ) : (
                    <>
                      <FaSave />
                      {isMobile ? 'Update' : 'Update Profile'}
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

export default EditDonorModal;