// Pages/backend/Donor/DonorProfile/EditDonorModal/EditDonorModal.jsx

// React
import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FaTint,
  FaMapMarkerAlt,
  FaHeartbeat,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
  FaFlask,
  FaStethoscope,
  FaPills,
  FaShieldAlt,
  FaClock,
  FaEdit,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../../hooks/useAuth";
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../../shared/BloodLoader";

const EditDonorModal = ({ donorId, donorData, refreshDonors, onSuccess }) => {
  const { axiosInstance } = useAxiosPublic();
  const { loading: authLoading } = useAuth();
  const token = localStorage.getItem("auth_token");

  // States
  const [step, setStep] = useState(1);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [diseases, setDiseases] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [medications, setMedications] = useState([]);
  const [newDisease, setNewDisease] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [newMedication, setNewMedication] = useState("");

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
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

  // Watch form values
  const selectedBloodGroup = watch("bloodGroup");
  const selectedRhFactor = watch("rhFactor");
  const selectedDonationType = watch("donationType");
  const maxDistance = watch("maxDistance");

  // Constants
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const rhFactors = ["positive", "negative"];
  const donationTypes = [
    { value: "whole_blood", label: "Whole Blood", icon: FaTint, description: "Standard whole blood donation (450ml)" },
    { value: "plasma", label: "Plasma", icon: FaFlask, description: "Plasma donation via apheresis" },
    { value: "platelets", label: "Platelets", icon: FaHeartbeat, description: "Platelet donation via apheresis" },
  ];

  // Common medical options
  const commonDiseases = ["Diabetes", "Hypertension", "Asthma", "Thyroid", "Heart Disease"];
  const commonAllergies = ["Pollen", "Dust", "Penicillin", "Latex", "Sulfa"];
  const commonMedications = ["Aspirin", "Ibuprofen", "Antihistamines", "Insulin", "Blood Thinners"];

  // Populate form with donor data
  const populateFormData = useCallback((donor) => {
    if (!donor) return;
    // Set form values
    setValue("bloodGroup", donor.medicalInfo?.bloodType || "");
    setValue("rhFactor", donor.medicalInfo?.rhFactor || "");
    setValue("hemoglobin", donor.medicalInfo?.hemoglobin || "");
    setValue("donationType", donor.donationPreferences?.donationType || ["whole_blood"]);
    setValue("maxDistance", donor.donationPreferences?.maxDistance || 50);
    setValue("emergencyDonor", donor.donationPreferences?.emergencyDonor || false);
    setValue("notifyForEmergency", donor.donationPreferences?.notifyForEmergency || true);
    setValue("isActive", donor.donationPreferences?.isActive !== false);

    // Set medical history arrays
    setDiseases(donor.medicalInfo?.diseases || []);
    setAllergies(donor.medicalInfo?.allergies || []);
    setMedications(donor.medicalInfo?.medications || []);
  }, [setValue]);

  // Fetch donor data from API
  const fetchDonorData = useCallback(async () => {
    if (!donorId) return;
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
      setApiError(error.response?.data?.error || "Failed to load donor data. Please try again.");
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

  // Close Modal Function
  const closeModal = (shouldRefresh = false) => {
    reset();
    setStep(1);
    setApiError("");
    setDiseases([]);
    setAllergies([]);
    setMedications([]);
    document.getElementById('edit_donor_modal').close();
    if (shouldRefresh && onSuccess) onSuccess();
  };

  // Step Next handler
  const nextStep = async () => {
    setApiError("");
    let fieldsToValidate = [];
    if (step === 1) fieldsToValidate = ["bloodGroup", "rhFactor", "hemoglobin"];
    if (step === 2) fieldsToValidate = ["donationType", "maxDistance"];
    if (step === 3) fieldsToValidate = [];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  // Step Prev handler
  const prevStep = () => {
    setApiError("");
    setStep(step - 1);
  };

  // Medical history handlers
  const handleAddDisease = () => {
    if (newDisease.trim() && !diseases.includes(newDisease.trim())) {
      setDiseases([...diseases, newDisease.trim()]);
      setNewDisease("");
    }
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  const handleAddMedication = () => {
    if (newMedication.trim() && !medications.includes(newMedication.trim())) {
      setMedications([...medications, newMedication.trim()]);
      setNewMedication("");
    }
  };

  // Quick select handlers
  const handleQuickSelectDisease = (disease) => {
    if (diseases.includes(disease)) {
      setDiseases(diseases.filter(d => d !== disease));
    } else {
      setDiseases([...diseases, disease]);
    }
  };

  const handleQuickSelectAllergy = (allergy) => {
    if (allergies.includes(allergy)) {
      setAllergies(allergies.filter(a => a !== allergy));
    } else {
      setAllergies([...allergies, allergy]);
    }
  };

  const handleQuickSelectMedication = (med) => {
    if (medications.includes(med)) {
      setMedications(medications.filter(m => m !== med));
    } else {
      setMedications([...medications, med]);
    }
  };

  // Submit handler
  const onSubmit = async (data) => {
    if (!donorId) {
      setApiError("Donor ID is missing. Please refresh and try again.");
      return;
    }

    setLoading(true);
    setApiError("");

    const hemoglobinValue = data.hemoglobin ? parseFloat(data.hemoglobin) : null;

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

        if (refreshDonors) {
          refreshDonors();
        }

        // SweetAlert2 success with DaisyUI styling
        await Swal.fire({
          title: "Donor Profile Updated! 🎉",
          html: `
            <div class="text-center">
              <p class="mb-2">Your donor profile has been updated successfully.</p>
              <p class="text-sm text-base-content/70">You are still eligible to donate blood and save lives!</p>
            </div>
          `,
          icon: "success",
          confirmButtonColor: "#ef4444",
          confirmButtonText: "Great!",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        });
      }
    } catch (error) {
      console.error("Failed to update donor profile:", error);
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

  if (authLoading || fetchLoading) return <BloodLoader fullscreen={false} />;

  return (
    <div className="modal-box w-11/12 max-w-2xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className="bg-linear-to-r from-warning to-warning/80 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FaEdit size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">Edit Donor Profile</h3>
              <p className="text-white/80 text-sm">Update your donor information</p>
            </div>
          </div>

          <button
            onClick={closeModal}
            type="button"
            className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
          >
            <FaTimes size={20} />
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-6 pt-6">
        <div className="steps steps-horizontal w-full">
          <div className={`step ${step >= 1 ? "step-warning" : ""}`}>Blood Info</div>
          <div className={`step ${step >= 2 ? "step-warning" : ""}`}>Preferences</div>
          <div className={`step ${step >= 3 ? "step-warning" : ""}`}>Medical History</div>
          <div className={`step ${step >= 4 ? "step-warning" : ""}`}>Review</div>
        </div>
      </div>

      {/* Inline API Error Message */}
      {apiError && (
        <div className="px-6 pt-4">
          <div className="alert alert-error shadow-lg">
            <div className="flex items-center gap-2">
              <FaExclamationCircle size={20} />
              <span>{apiError}</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Blood Information */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Blood Type Selection */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaTint className="text-warning" /> Blood Type
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {bloodTypes.map((type) => (
                    <label key={type} className="cursor-pointer">
                      <input
                        type="radio"
                        value={type}
                        className="hidden"
                        {...register("bloodGroup", {
                          required: "Please select your blood type",
                        })}
                      />
                      <div
                        className={`btn btn-sm w-full ${selectedBloodGroup === type
                          ? "btn-warning text-white"
                          : "btn-outline btn-warning"
                          }`}
                      >
                        {type}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.bloodGroup && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.bloodGroup.message}</span>
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
                    <label key={factor} className="cursor-pointer">
                      <input
                        type="radio"
                        value={factor}
                        className="hidden"
                        {...register("rhFactor", {
                          required: "Please select your Rh factor",
                        })}
                      />
                      <div
                        className={`btn btn-sm w-full ${selectedRhFactor === factor
                          ? "btn-warning text-white"
                          : "btn-outline btn-warning"
                          }`}
                      >
                        {factor === "positive" ? "Positive (+)" : "Negative (-)"}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.rhFactor && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.rhFactor.message}</span>
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
                  className={`input input-bordered w-full ${errors.hemoglobin ? "input-error" : ""}`}
                  {...register("hemoglobin", {
                    required: "Hemoglobin level is required",
                    min: { value: 5, message: "Hemoglobin seems too low (minimum 5 g/dL)" },
                    max: { value: 20, message: "Hemoglobin seems too high (maximum 20 g/dL)" },
                  })}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">Minimum required: 12.5 g/dL for women, 13.5 g/dL for men</span>
                </label>
                {errors.hemoglobin && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.hemoglobin.message}</span>
                  </label>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Donation Preferences */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
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
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                          ? "border-warning bg-warning/10"
                          : "border-base-300 hover:border-warning/50"
                          }`}
                      >
                        <input
                          type="checkbox"
                          value={type.value}
                          className="hidden"
                          {...register("donationType", {
                            required: "Please select at least one donation type",
                          })}
                        />
                        <Icon className={`text-xl ${isSelected ? "text-warning" : "text-gray-400"}`} />
                        <div className="flex-1">
                          <p className={`font-semibold ${isSelected ? "text-warning" : ""}`}>
                            {type.label}
                          </p>
                          <p className="text-xs opacity-70">{type.description}</p>
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
                    <span className="label-text-alt text-error">{errors.donationType.message}</span>
                  </label>
                )}
              </div>

              {/* Maximum Travel Distance Slider */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaMapMarkerAlt className="text-warning" /> Maximum Travel Distance (km)
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
                <div className="flex justify-between text-xs px-2">
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
                    className="checkbox checkbox-warning"
                    {...register("emergencyDonor")}
                  />
                  <span className="label-text">Register as emergency donor</span>
                </label>
                <p className="text-xs opacity-70 ml-8">
                  Willing to donate in emergency situations when contacted directly
                </p>
              </div>

              {/* Emergency Notifications Toggle */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-warning"
                    {...register("notifyForEmergency")}
                  />
                  <span className="label-text">Receive emergency notifications</span>
                </label>
                <p className="text-xs opacity-70 ml-8">
                  Get notified via SMS/email when your blood type is urgently needed
                </p>
              </div>

              {/* Divider for Optional Settings */}
              <div className="divider text-xs opacity-50">Optional Settings</div>

              {/* Active Donor Status Toggle */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-warning"
                    {...register("isActive")}
                  />
                  <span className="label-text">Active donor status</span>
                </label>
                <p className="text-xs opacity-70 ml-8">
                  Make your profile visible to blood banks and hospitals
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 3: Medical History */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Medical History Info Alert */}
              <div className="alert alert-info bg-info/10 border-info/20">
                <FaStethoscope className="text-info" />
                <span className="text-sm text-primary">This information helps ensure safe donations for both you and recipients.</span>
              </div>

              {/* Medical Conditions Section */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaStethoscope className="text-warning" /> Medical Conditions
                  </span>
                </label>
                <div className="space-y-2">
                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {commonDiseases.map((disease) => (
                      <button
                        key={disease}
                        type="button"
                        onClick={() => handleQuickSelectDisease(disease)}
                        className={`btn btn-xs ${diseases.includes(disease)
                          ? "btn-warning text-white"
                          : "btn-outline btn-warning"
                          }`}
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
                      onKeyDown={(e) => e.key === 'Enter' && handleAddDisease()}
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

                {/* Display Selected Conditions */}
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
                  <div className="flex flex-wrap gap-2">
                    {commonAllergies.map((allergy) => (
                      <button
                        key={allergy}
                        type="button"
                        onClick={() => handleQuickSelectAllergy(allergy)}
                        className={`btn btn-xs ${allergies.includes(allergy)
                          ? "btn-warning text-white"
                          : "btn-outline btn-warning"
                          }`}
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
                      onKeyDown={(e) => e.key === 'Enter' && handleAddAllergy()}
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

                {/* Display Selected Allergies */}
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
                  <div className="flex flex-wrap gap-2">
                    {commonMedications.map((med) => (
                      <button
                        key={med}
                        type="button"
                        onClick={() => handleQuickSelectMedication(med)}
                        className={`btn btn-xs ${medications.includes(med)
                          ? "btn-warning text-white"
                          : "btn-outline btn-warning"
                          }`}
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
                      onKeyDown={(e) => e.key === 'Enter' && handleAddMedication()}
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

                {/* Display Selected Medications */}
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

          {/* Step 4: Review */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Review Info Alert */}
              <div className="alert alert-warning bg-warning/10 border-warning/20">
                <FaCheckCircle className="text-warning" />
                <span className="text-sm text-warning">Please review your updated information before submitting.</span>
              </div>

              {/* Blood Information Review */}
              <div className="bg-base-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FaTint className="text-warning" />
                  Blood Information
                </h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
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

              {/* Donation Preferences Review */}
              <div className="bg-base-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FaHeartbeat className="text-warning" />
                  Donation Preferences
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
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
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="opacity-70">Emergency Donor</p>
                    <p className="font-medium">{watch("emergencyDonor") ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Emergency Notifications</p>
                    <p className="font-medium">{watch("notifyForEmergency") ? "Enabled" : "Disabled"}</p>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="opacity-70">Active Status</p>
                  <p className="font-medium">{watch("isActive") ? "Active" : "Inactive"}</p>
                </div>
              </div>

              {/* Medical History Review */}
              <div className="bg-base-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FaStethoscope className="text-warning" />
                  Medical History
                </h4>
                <div className="text-sm space-y-2">
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

              {/* Eligibility Note */}
              <div className="text-xs text-base-content/60 text-center flex items-center justify-center gap-1">
                <FaClock className="inline" />
                Your eligibility settings will be preserved
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-action border-t border-base-300 p-4 bg-base-200/50">
          <div className="flex justify-between w-full">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-outline btn-warning"
              >
                ← Previous
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-warning text-white ml-auto"
              >
                Next →
              </button>
            ) : (
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-warning text-white gap-2"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaEdit />
                      Update Donor Profile
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
