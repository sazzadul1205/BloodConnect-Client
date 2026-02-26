// Pages/backend/Donor/MedicalInformation/MedicalInformation.jsx

// React
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";

// Sweet Alert
import Swal from "sweetalert2";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FiSave,
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiEdit3,
  FiClock,
  FiX,
} from "react-icons/fi";
import {
  FaTint,
  FaFlask,
  FaHeartbeat,
  FaStethoscope,
  FaPills,
  FaShieldAlt,
  FaTimes,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Components
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";

// Constants
const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const rhFactors = ["positive", "negative"];

// Common medical options for quick selection
const commonDiseases = ["Diabetes", "Hypertension", "Asthma", "Thyroid", "Heart Disease"];
const commonAllergies = ["Pollen", "Dust", "Penicillin", "Latex", "Sulfa"];
const commonMedications = ["Aspirin", "Ibuprofen", "Antihistamines", "Insulin", "Blood Thinners"];

const MedicalInformation = () => {
  const { donorId: routeDonorId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { axiosInstance } = useAxiosPublic();

  // Get donor ID from route or auth
  const authDonorId = useMemo(
    () => user?.userId || user?._id || user?.id || user?.uid,
    [user],
  );
  const donorId = routeDonorId || authDonorId;

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Medical history arrays for multi-select
  const [diseases, setDiseases] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [medications, setMedications] = useState([]);

  // Input states for custom additions
  const [newDisease, setNewDisease] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [newMedication, setNewMedication] = useState("");

  // Form state
  const [form, setForm] = useState({
    bloodType: "",
    rhFactor: "",
    hemoglobin: "",
  });

  // Fetch medical information
  useEffect(() => {
    const fetchMedicalInfo = async () => {
      if (authLoading) return;
      if (!donorId) {
        setError(new Error("Donor ID not found. Please log in again."));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("auth_token");
        const res = await axiosInstance.get(`/donors/${donorId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const medical = res?.data?.data?.medicalInfo || {};

        // Set form fields
        setForm({
          bloodType: medical.bloodType || "",
          rhFactor: medical.rhFactor || "",
          hemoglobin: medical.hemoglobin === null || medical.hemoglobin === undefined
            ? ""
            : String(medical.hemoglobin),
        });

        // Set medical history arrays
        setDiseases(Array.isArray(medical.diseases) ? medical.diseases : []);
        setAllergies(Array.isArray(medical.allergies) ? medical.allergies : []);
        setMedications(Array.isArray(medical.medications) ? medical.medications : []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalInfo();
  }, [authLoading, donorId, axiosInstance]);

  // Open modal with current data
  const openEditModal = () => {
    setIsModalOpen(true);
    setStep(1);
  };

  // Close modal and reset
  const closeModal = () => {
    setIsModalOpen(false);
    setStep(1);
    setNewDisease("");
    setNewAllergy("");
    setNewMedication("");
  };

  // Form change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

  // Remove item handlers
  const removeDisease = (index) => {
    setDiseases(diseases.filter((_, i) => i !== index));
  };

  const removeAllergy = (index) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  // Navigation handlers
  const nextStep = () => {
    if (step === 1) {
      // Validate blood info
      if (!form.bloodType || !form.rhFactor || !form.hemoglobin) {
        Swal.fire({
          title: "Incomplete Information",
          text: "Please fill in all blood information fields",
          icon: "warning",
          confirmButtonColor: "#ef4444",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        });
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!donorId) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const payload = {
        bloodType: form.bloodType || undefined,
        rhFactor: form.rhFactor || undefined,
        hemoglobin: form.hemoglobin === "" ? undefined : Number(form.hemoglobin),
        diseases: diseases,
        allergies: allergies,
        medications: medications,
      };

      await axiosInstance.patch(`/donors/${donorId}/medical-info`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      closeModal();

      await Swal.fire({
        title: "Medical Information Updated",
        html: `
          <div class="text-center">
            <p class="mb-2">Your medical information has been saved successfully.</p>
            <p class="text-sm text-base-content/70">This helps ensure safe donations for both you and recipients.</p>
          </div>
        `,
        icon: "success",
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Great!",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });
    } catch (err) {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Could not update medical information.",
        icon: "error",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });
    } finally {
      setSaving(false);
    }
  };

  // Edit Modal Component
  const EditModal = () => (
    <dialog
      id="edit_medical_modal"
      className={`modal ${isModalOpen ? "modal-open" : ""}`}
    >
      <div className="modal-box w-11/12 max-w-2xl p-0 overflow-hidden bg-base-100">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-warning to-warning/80 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full">
                <FiEdit3 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-2xl">Edit Medical Information</h3>
                <p className="text-white/80 text-sm">Update your medical details</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              type="button"
              className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-6">
          <div className="steps steps-horizontal w-full">
            <div className={`step ${step >= 1 ? "step-warning" : ""}`}>Blood Info</div>
            <div className={`step ${step >= 2 ? "step-warning" : ""}`}>Conditions</div>
            <div className={`step ${step >= 3 ? "step-warning" : ""}`}>Allergies & Meds</div>
            <div className={`step ${step >= 4 ? "step-warning" : ""}`}>Review</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Step 1: Blood Information */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <h3 className="font-semibold flex items-center gap-2 text-lg">
                  <FaTint className="text-warning" />
                  Blood Information
                </h3>

                <div className="space-y-4">
                  {/* Blood Type Selection */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium flex items-center gap-2">
                        <FaTint className="text-warning" /> Blood Type
                      </span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
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
                            className={`btn btn-sm w-full ${form.bloodType === type
                              ? "btn-warning text-white"
                              : "btn-outline btn-warning"
                              }`}
                          >
                            {type}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Rh Factor Selection */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium flex items-center gap-2">
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
                            className={`btn btn-sm w-full ${form.rhFactor === factor
                              ? "btn-warning text-white"
                              : "btn-outline btn-warning"
                              }`}
                          >
                            {factor === "positive" ? "Positive (+)" : "Negative (-)"}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Hemoglobin Input */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium flex items-center gap-2">
                        <FaHeartbeat className="text-warning" /> Hemoglobin (g/dL)
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="5"
                      max="20"
                      name="hemoglobin"
                      className="input input-bordered w-full"
                      value={form.hemoglobin}
                      onChange={handleChange}
                      placeholder="e.g. 13.5"
                      required
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        Minimum required: 12.5 g/dL for women, 13.5 g/dL for men
                      </span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Medical Conditions */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <h3 className="font-semibold flex items-center gap-2 text-lg">
                  <FaStethoscope className="text-warning" />
                  Medical Conditions
                </h3>

                <div className="space-y-4">
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

                  {/* Display Selected Conditions */}
                  {diseases.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {diseases.map((disease, i) => (
                        <span key={i} className="badge badge-warning gap-1 p-3">
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Allergies Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 text-lg">
                    <FaPills className="text-warning" />
                    Allergies
                  </h3>

                  <div className="space-y-4">
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

                    {/* Display Selected Allergies */}
                    {allergies.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {allergies.map((allergy, i) => (
                          <span key={i} className="badge badge-warning gap-1 p-3">
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
                </div>

                {/* Medications Section */}
                <div className="space-y-4 pt-4 border-t border-base-300">
                  <h3 className="font-semibold flex items-center gap-2 text-lg">
                    <FaShieldAlt className="text-warning" />
                    Current Medications
                  </h3>

                  <div className="space-y-4">
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

                    {/* Display Selected Medications */}
                    {medications.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {medications.map((med, i) => (
                          <span key={i} className="badge badge-warning gap-1 p-3">
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
                </div>
              </motion.div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Review Info Alert */}
                <div className="alert alert-warning bg-warning/10 border-warning/20">
                  <FiCheckCircle className="text-warning" />
                  <span className="text-sm text-warning">Please review your updated information before saving.</span>
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
                      <p className="font-medium text-warning">{form.bloodType || "Not set"}</p>
                    </div>
                    <div>
                      <p className="opacity-70">Rh Factor</p>
                      <p className="font-medium">
                        {form.rhFactor === "positive" ? "Positive (+)" :
                          form.rhFactor === "negative" ? "Negative (-)" : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="opacity-70">Hemoglobin</p>
                      <p className="font-medium">{form.hemoglobin || "Not set"} g/dL</p>
                    </div>
                  </div>
                </div>

                {/* Medical History Review */}
                <div className="bg-base-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FaStethoscope className="text-warning" />
                    Medical History
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm opacity-70 mb-1">Medical Conditions</p>
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
                      <p className="text-sm opacity-70 mb-1">Allergies</p>
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
                      <p className="text-sm opacity-70 mb-1">Medications</p>
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

                {/* Note */}
                <div className="text-xs text-base-content/60 text-center flex items-center justify-center gap-1">
                  <FiClock className="inline" />
                  This information helps ensure safe donations for both you and recipients
                </div>
              </motion.div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-action border-t border-base-300 p-4 bg-base-200/50">
            <div className="flex justify-between w-full">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-outline btn-warning"
                >
                  Previous
                </button>
              )}
              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-warning text-white ml-auto"
                >
                  Next
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
                    disabled={saving}
                    className="btn btn-warning text-white gap-2"
                  >
                    {saving ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Modal backdrop - closes modal when clicked outside */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={closeModal}>close</button>
      </form>
    </dialog>
  );

  // Loading state
  if (loading || authLoading) return <BloodLoader />;

  // Error state
  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FiActivity className="text-error" />
            Medical Information
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Your current medical details used for donation eligibility
          </p>
        </div>
        <button
          onClick={openEditModal}
          className="btn btn-error btn-sm gap-2"
        >
          <FiEdit3 />
          Edit Information
        </button>
      </div>

      {/* Display Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Blood Information Card */}
        <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-error/10 p-2 rounded-full">
              <FaTint className="text-error" />
            </div>
            <h3 className="font-semibold">Blood Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm opacity-70">Blood Type</p>
              <p className="font-medium text-error">{form.bloodType || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Rh Factor</p>
              <p className="font-medium">
                {form.rhFactor === "positive" ? "Positive (+)" :
                  form.rhFactor === "negative" ? "Negative (-)" : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-70">Hemoglobin</p>
              <p className="font-medium">{form.hemoglobin || "Not set"} g/dL</p>
            </div>
          </div>
        </div>

        {/* Medical Conditions Card */}
        <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-error/10 p-2 rounded-full">
              <FaStethoscope className="text-error" />
            </div>
            <h3 className="font-semibold">Medical Conditions</h3>
          </div>
          <div>
            {diseases.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {diseases.map((disease, i) => (
                  <span key={i} className="badge badge-error badge-sm p-2">
                    {disease}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm opacity-70 italic">No conditions reported</p>
            )}
          </div>
        </div>

        {/* Allergies Card */}
        <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-error/10 p-2 rounded-full">
              <FaPills className="text-error" />
            </div>
            <h3 className="font-semibold">Allergies</h3>
          </div>
          <div>
            {allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy, i) => (
                  <span key={i} className="badge badge-warning badge-sm p-2">
                    {allergy}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm opacity-70 italic">No allergies reported</p>
            )}
          </div>
        </div>

        {/* Medications Card - Full width */}
        <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-5 md:col-span-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-error/10 p-2 rounded-full">
              <FaShieldAlt className="text-error" />
            </div>
            <h3 className="font-semibold">Current Medications</h3>
          </div>
          <div>
            {medications.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {medications.map((med, i) => (
                  <span key={i} className="badge badge-info badge-sm p-2">
                    {med}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm opacity-70 italic">No medications reported</p>
            )}
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="alert bg-info/10 border border-info/20">
        <FiAlertCircle className="text-info" />
        <span className="text-sm">
          Keep this information accurate for safe and faster donation matching.
        </span>
      </div>

      {/* Edit Modal */}
      <EditModal />
    </div>
  );
};

export default MedicalInformation;
