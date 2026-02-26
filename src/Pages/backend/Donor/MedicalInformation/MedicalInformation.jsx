// Pages/backend/Donor/MedicalInformation/MedicalInformation.jsx

// React
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FiActivity,
  FiAlertCircle,
  FiEdit3,
} from "react-icons/fi";
import {
  FaTint,
  FaStethoscope,
  FaPills,
  FaShieldAlt,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Components
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";
import MedicalEditModal from "./MedicalEditModal/MedicalEditModal";

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
  const [modalKey, setModalKey] = useState(0);

  // Medical history arrays for multi-select
  const [diseases, setDiseases] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [medications, setMedications] = useState([]);

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
    setModalKey((prev) => prev + 1);
    document.getElementById("edit_medical_modal")?.showModal();
  };

  // Close modal
  const closeModal = () => {
    document.getElementById("edit_medical_modal")?.close();
  };

  // Save handler called from modal
  const handleSaveMedical = async (updatedMedical) => {
    if (!donorId) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const payload = {
        bloodType: updatedMedical.form.bloodType || undefined,
        rhFactor: updatedMedical.form.rhFactor || undefined,
        hemoglobin:
          updatedMedical.form.hemoglobin === ""
            ? undefined
            : Number(updatedMedical.form.hemoglobin),
        diseases: updatedMedical.diseases,
        allergies: updatedMedical.allergies,
        medications: updatedMedical.medications,
      };

      await axiosInstance.patch(`/donors/${donorId}/medical-info`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // Sync view state with saved values
      setForm({
        bloodType: updatedMedical.form.bloodType,
        rhFactor: updatedMedical.form.rhFactor,
        hemoglobin: updatedMedical.form.hemoglobin,
      });
      setDiseases(updatedMedical.diseases);
      setAllergies(updatedMedical.allergies);
      setMedications(updatedMedical.medications);

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
      return true;
    } catch (err) {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Could not update medical information.",
        icon: "error",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

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
      <dialog id="edit_medical_modal" className="modal">
        <MedicalEditModal
          saving={saving}
          closeModal={closeModal}
          onSave={handleSaveMedical}
          modalKey={modalKey}
          initialForm={form}
          initialDiseases={diseases}
          initialAllergies={allergies}
          initialMedications={medications}
          bloodTypes={bloodTypes}
          rhFactors={rhFactors}
          commonDiseases={commonDiseases}
          commonAllergies={commonAllergies}
          commonMedications={commonMedications}
        />
        <form method="dialog" className="modal-backdrop" onClick={closeModal}>
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default MedicalInformation;
