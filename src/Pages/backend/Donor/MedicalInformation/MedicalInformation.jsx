// Pages/backend/Donor/MedicalInformation/MedicalInformation.jsx

// React
import React, { useMemo, useState } from "react";
import { useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
import DonorProfileRequired from "../../../../shared/DonorProfileRequired";

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
  const queryClient = useQueryClient();

  // Get donor ID from route or auth
  const authDonorId = useMemo(
    () => user?.userId || user?._id || user?.id || user?.uid,
    [user],
  );
  const donorId = routeDonorId || authDonorId;

  // Modal state
  const [modalKey, setModalKey] = useState(0);

  // Fetch medical information using TanStack Query
  const {
    data: medicalData = {},
    isLoading,
    error,
    isError,
    refetch
  } = useQuery({
    queryKey: ['donorMedicalInfo', donorId],
    queryFn: async () => {
      if (!donorId) {
        throw new Error("Donor ID not found. Please log in again.");
      }

      const token = localStorage.getItem("auth_token");
      const res = await axiosInstance.get(`/donors/${donorId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // Check if donor profile exists
      if (res?.data?.data === null) {
        throw { isProfileMissing: true, message: "Donor profile not found" };
      }

      return res?.data?.data?.medicalInfo || {};
    },
    enabled: !!donorId && !authLoading,
    retry: (failureCount, error) => {
      // Don't retry if profile is missing
      if (error?.isProfileMissing) return false;
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Extract form values from medical data
  const form = {
    bloodType: medicalData.bloodType || "",
    rhFactor: medicalData.rhFactor || "",
    hemoglobin: medicalData.hemoglobin === null || medicalData.hemoglobin === undefined
      ? ""
      : String(medicalData.hemoglobin),
  };

  // Extract arrays from medical data
  const diseases = Array.isArray(medicalData.diseases) ? medicalData.diseases : [];
  const allergies = Array.isArray(medicalData.allergies) ? medicalData.allergies : [];
  const medications = Array.isArray(medicalData.medications) ? medicalData.medications : [];

  // Update medical info mutation
  const updateMedicalInfoMutation = useMutation({
    mutationFn: async (updatedMedical) => {
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

      return updatedMedical;
    },
    onSuccess: async (updatedMedical) => {
      // Update the cache with the new data
      queryClient.setQueryData(['donorMedicalInfo', donorId], (oldData) => ({
        ...oldData,
        ...updatedMedical.form,
        diseases: updatedMedical.diseases,
        allergies: updatedMedical.allergies,
        medications: updatedMedical.medications,
      }));

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
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Could not update medical information.",
        icon: "error",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });
    }
  });

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
    if (!donorId) return false;

    try {
      await updateMedicalInfoMutation.mutateAsync(updatedMedical);
      return true;
    } catch {
      return false;
    }
  };

  // Check if profile is missing (404 error)
  const isProfileMissing = error?.isProfileMissing ||
    (error?.response?.status === 404);

  // Loading state
  if (isLoading || authLoading) return <BloodLoader />;

  // Error state
  if (isError && !isProfileMissing) {
    return (
      <ErrorState
        error={error}
        onRetry={() => refetch()}
      />
    );
  }

  if (isProfileMissing) {
    return (
      <DonorProfileRequired
        title="Medical Info Needs Donor Profile"
        description="Create your donor profile to manage medical information and eligibility."
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-h-screen bg-base-200 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FiActivity className="text-error" />
            Medical Information
          </h2>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Your current medical details used for donation eligibility
          </p>
        </div>
        <button
          onClick={openEditModal}
          disabled={updateMedicalInfoMutation.isLoading}
          className="btn btn-error btn-sm sm:btn-md gap-2 w-full sm:w-auto"
        >
          <FiEdit3 />
          Edit Information
        </button>
      </div>

      {/* Display Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Blood Information Card */}
        <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="bg-error/10 p-1.5 sm:p-2 rounded-full">
              <FaTint className="text-error text-sm sm:text-base" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base">Blood Information</h3>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col xs:flex-row xs:justify-between sm:block">
              <p className="text-xs sm:text-sm opacity-70">Blood Type</p>
              <p className="font-medium text-error text-sm sm:text-base">{form.bloodType || "Not set"}</p>
            </div>
            <div className="flex flex-col xs:flex-row xs:justify-between sm:block">
              <p className="text-xs sm:text-sm opacity-70">Rh Factor</p>
              <p className="font-medium text-sm sm:text-base">
                {form.rhFactor === "positive" ? "Positive (+)" :
                  form.rhFactor === "negative" ? "Negative (-)" : "Not set"}
              </p>
            </div>
            <div className="flex flex-col xs:flex-row xs:justify-between sm:block">
              <p className="text-xs sm:text-sm opacity-70">Hemoglobin</p>
              <p className="font-medium text-sm sm:text-base">{form.hemoglobin || "Not set"} g/dL</p>
            </div>
          </div>
        </div>

        {/* Medical Conditions Card */}
        <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="bg-error/10 p-1.5 sm:p-2 rounded-full">
              <FaStethoscope className="text-error text-sm sm:text-base" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base">Medical Conditions</h3>
          </div>
          <div>
            {diseases.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {diseases.map((disease, i) => (
                  <span key={i} className="badge badge-error badge-sm p-1.5 sm:p-2 text-xs">
                    {disease}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm opacity-70 italic">No conditions reported</p>
            )}
          </div>
        </div>

        {/* Allergies Card */}
        <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="bg-error/10 p-1.5 sm:p-2 rounded-full">
              <FaPills className="text-error text-sm sm:text-base" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base">Allergies</h3>
          </div>
          <div>
            {allergies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {allergies.map((allergy, i) => (
                  <span key={i} className="badge badge-warning badge-sm p-1.5 sm:p-2 text-xs">
                    {allergy}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm opacity-70 italic">No allergies reported</p>
            )}
          </div>
        </div>

        {/* Medications Card - Full width on all screens */}
        <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-5 col-span-1 sm:col-span-2 lg:col-span-3">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="bg-error/10 p-1.5 sm:p-2 rounded-full">
              <FaShieldAlt className="text-error text-sm sm:text-base" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base">Current Medications</h3>
          </div>
          <div>
            {medications.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {medications.map((med, i) => (
                  <span key={i} className="badge badge-info badge-sm p-1.5 sm:p-2 text-xs">
                    {med}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm opacity-70 italic">No medications reported</p>
            )}
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="alert bg-info/10 border border-info/20 p-3 sm:p-4">
        <FiAlertCircle className="text-info shrink-0 text-sm sm:text-base" />
        <span className="text-xs sm:text-sm">
          Keep this information accurate for safe and faster donation matching.
        </span>
      </div>

      {/* Edit Modal */}
      <dialog id="edit_medical_modal" className="modal">
        <MedicalEditModal
          saving={updateMedicalInfoMutation.isLoading}
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
        <form method="dialog" className="modal-backdrop hidden md:block" onClick={closeModal}>
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default MedicalInformation;