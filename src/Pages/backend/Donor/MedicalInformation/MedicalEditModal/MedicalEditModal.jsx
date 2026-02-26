// Pages/backend/Donor/MedicalInformation/MedicalEditModal/MedicalEditModal.jsx

import { useEffect, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FiSave,
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

// sweet alert
import Swal from "sweetalert2";

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
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    bloodType: "",
    rhFactor: "",
    hemoglobin: "",
  });
  const [diseases, setDiseases] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [medications, setMedications] = useState([]);
  const [newDisease, setNewDisease] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [newMedication, setNewMedication] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep(1);
    setForm(initialForm || { bloodType: "", rhFactor: "", hemoglobin: "" });
    setDiseases(Array.isArray(initialDiseases) ? initialDiseases : []);
    setAllergies(Array.isArray(initialAllergies) ? initialAllergies : []);
    setMedications(Array.isArray(initialMedications) ? initialMedications : []);
    setNewDisease("");
    setNewAllergy("");
    setNewMedication("");
  }, [modalKey, initialForm, initialDiseases, initialAllergies, initialMedications]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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

  const handleQuickSelectDisease = (disease) => {
    if (diseases.includes(disease)) {
      setDiseases(diseases.filter((d) => d !== disease));
    } else {
      setDiseases([...diseases, disease]);
    }
  };

  const handleQuickSelectAllergy = (allergy) => {
    if (allergies.includes(allergy)) {
      setAllergies(allergies.filter((a) => a !== allergy));
    } else {
      setAllergies([...allergies, allergy]);
    }
  };

  const handleQuickSelectMedication = (med) => {
    if (medications.includes(med)) {
      setMedications(medications.filter((m) => m !== med));
    } else {
      setMedications([...medications, med]);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await onSave({
      form,
      diseases,
      allergies,
      medications,
    });
    if (ok) {
      closeModal();
    }
  };

  return (
    <div className="modal-box w-11/12 max-w-2xl p-0 overflow-hidden bg-base-100">
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
                </div>
              </div>
            </motion.div>
          )}

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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDisease}
                    onChange={(e) => setNewDisease(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddDisease()}
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

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-lg">
                  <FaPills className="text-warning" />
                  Allergies
                </h3>
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddAllergy()}
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

              <div className="space-y-4 pt-4 border-t border-base-300">
                <h3 className="font-semibold flex items-center gap-2 text-lg">
                  <FaShieldAlt className="text-warning" />
                  Current Medications
                </h3>
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddMedication()}
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
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="alert alert-warning bg-warning/10 border-warning/20">
                <FiCheckCircle className="text-warning" />
                <span className="text-sm text-warning">Please review your updated information before saving.</span>
              </div>
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
              <div className="text-xs text-base-content/60 text-center flex items-center justify-center gap-1">
                <FiClock className="inline" />
                This information helps ensure safe donations for both you and recipients
              </div>
            </motion.div>
          )}
        </div>

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
  );
};

export default MedicalEditModal;
