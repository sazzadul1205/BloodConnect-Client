// Pages/backend/Admin/BloodBanksManagement/InventoryModal.jsx

// React
import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";

// Add motion import
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import { FiX, FiSave, FiRefreshCw } from "react-icons/fi";
import { FaExclamationCircle } from "react-icons/fa";

// sweetalert
import Swal from "sweetalert2";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

// ==================== QUERY KEYS ====================

const queryKeys = {
  bankDetails: (bankId) => ['bank-details', bankId],
};

// ==================== CONSTANTS ====================

/**
 * Blood types for inventory management
 */
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/**
 * Default inventory values for new banks
 */
const getDefaultInventory = () => {
  return BLOOD_TYPES.map(bloodType => ({
    bloodType,
    units: 0,
    threshold: 10,
    lastUpdated: new Date(),
    components: {
      wholeBlood: 0,
      plasma: 0,
      platelets: 0,
      cryoprecipitate: 0,
    }
  }));
};

// ==================== ANIMATION VARIANTS ====================

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

// ==================== MAIN COMPONENT ====================

/**
 * Inventory Modal Component
 * Allows managing blood inventory for a specific blood bank
 * 
 * @param {string} bankId - ID of the blood bank
 * @param {Function} onClose - Function to close the modal
 * @param {Function} refreshBanks - Function to refresh banks list after update
 */
const InventoryModal = ({ bankId, onClose, refreshBanks }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // ==================== STATE MANAGEMENT ====================

  const [apiError, setApiError] = useState("");
  const [inventory, setInventory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==================== TANSTACK QUERY ====================

  /**
   * Fetch bank details to get current inventory
   */
  const { data: bankData } = useQuery({
    queryKey: queryKeys.bankDetails(bankId),
    queryFn: async () => {
      const res = await axiosInstance.get(`/blood-banks/${bankId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!bankId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // ==================== EFFECTS ====================

  /**
   * Initialize inventory from bank data or create default
   */
  useEffect(() => {
    if (bankData?.data?.inventory) {
      setInventory(bankData.data.inventory);
    } else {
      // Initialize with default values
      setInventory(getDefaultInventory());
    }
  }, [bankData]);

  // ==================== COMPUTED VALUES ====================

  /**
   * Calculate total units across all blood types
   */
  const totalUnits = inventory.reduce((sum, item) => sum + (item.units || 0), 0);

  /**
   * Get low stock items (units <= threshold)
   */
  const lowStockItems = inventory.filter(item => item.units <= item.threshold);

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Handle inventory field changes
   */
  const handleInventoryChange = (bloodType, field, value) => {
    setInventory(prev => prev.map(item => {
      if (item.bloodType === bloodType) {
        if (field === 'units' || field === 'threshold') {
          return { ...item, [field]: parseInt(value) || 0 };
        } else {
          // Handle component fields
          return {
            ...item,
            components: {
              ...item.components,
              [field]: parseInt(value) || 0
            }
          };
        }
      }
      return item;
    }));
  };

  /**
   * Handle form submission to update inventory
   */
  const handleSubmit = async (e) => {
    setApiError("");
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare updates payload
      const updates = inventory.map(item => ({
        bloodType: item.bloodType,
        units: item.units,
        components: item.components,
      }));

      const response = await axiosInstance.patch(
        `/blood-banks/${bankId}/inventory`,
        { updates },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        onClose();
        refreshBanks();

        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Inventory updated successfully",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
            title: "text-lg font-bold text-error",
            content: "text-xs sm:text-sm text-base-content/80",
            confirmButton: "btn btn-sm btn-error",
          },
          buttonsStyling: false,
        });
      }
    } catch (error) {
      console.error("Error updating inventory:", error);
      setApiError(error.response?.data?.error || "Failed to update inventory");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset all inventory values to zero
   */
  const handleResetAll = () => {
    setInventory(prev => prev.map(item => ({
      ...item,
      units: 0,
      components: {
        wholeBlood: 0,
        plasma: 0,
        platelets: 0,
        cryoprecipitate: 0,
      }
    })));
  };

  /**
   * Set all units to at least 2x threshold
   */
  const handleSetMinimumStock = () => {
    setInventory(prev => prev.map(item => ({
      ...item,
      units: Math.max(item.threshold * 2, item.units),
    })));
  };

  // ==================== RENDER ====================

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="md:modal-box w-11/12 max-w-6xl p-0 overflow-hidden bg-base-100 mx-2 sm:mx-0"
    >

      {/* ==================== MODAL HEADER ==================== */}
      <div className="flex justify-between items-center p-4 sm:p-6 border-b border-base-300 bg-base-100">
        <div>
          <h2 className="font-bold text-lg sm:text-xl">Manage Inventory</h2>
          <p className="text-xs sm:text-sm text-base-content/70">
            {bankData?.data?.name || "Blood Bank"} • Total Units: {totalUnits}
          </p>
        </div>
        <button
          onClick={onClose}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Close modal"
        >
          <FiX size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* ==================== LOW STOCK ALERT ==================== */}
      {lowStockItems.length > 0 && (
        <div className="px-4 sm:px-6 pt-4">
          <div className="alert alert-warning shadow-lg p-3 sm:p-4 flex-col xs:flex-row gap-2">
            <FiRefreshCw className="animate-spin text-warning text-lg sm:text-xl shrink-0" />
            <span className="text-xs sm:text-sm">
              {lowStockItems.length} blood type(s) have low inventory:
              {lowStockItems.map(item => ` ${item.bloodType} (${item.units}/${item.threshold})`).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* ==================== ERROR ALERT ==================== */}
      {apiError && (
        <div className="px-4 sm:px-6 pt-4">
          <div className="alert alert-error shadow-lg p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <FaExclamationCircle size={16} className="sm:w-5 sm:h-5 shrink-0" />
              <span className="text-xs sm:text-sm">{apiError}</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== FORM ==================== */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
        <div className="space-y-4 sm:space-y-6">

          {/* ==================== INVENTORY TABLE ==================== */}
          <div className="overflow-x-auto">
            <table className="table table-xs sm:table-sm md:table-md w-full">

              {/* Table Header */}
              <thead>
                <tr className="bg-base-200">
                  <th className="text-[10px] sm:text-sm">Blood Type</th>
                  <th className="text-[10px] sm:text-sm">Units</th>
                  <th className="text-[10px] sm:text-sm hidden xs:table-cell">Threshold</th>
                  <th colSpan={4} className="text-center text-[10px] sm:text-sm">Components</th>
                  <th className="text-[10px] sm:text-sm">Status</th>
                </tr>

                {/* Component Sub-header */}
                <tr className="bg-base-200 text-[8px] sm:text-xs">
                  <th></th>
                  <th></th>
                  <th className="hidden xs:table-cell"></th>
                  <th>Whole</th>
                  <th>Plasma</th>
                  <th>Platelets</th>
                  <th>Cryo</th>
                  <th></th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {inventory.map((item) => {
                  // Calculate inventory status
                  const status = item.units <= item.threshold
                    ? "Low"
                    : item.units <= item.threshold * 2
                      ? "Adequate"
                      : "Good";

                  const statusColor =
                    status === "Low" ? "text-error" :
                      status === "Adequate" ? "text-warning" :
                        "text-success";

                  return (
                    <tr key={item.bloodType}>
                      {/* Blood Type */}
                      <td className="font-semibold text-xs sm:text-sm">{item.bloodType}</td>

                      {/* Units */}
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.units}
                          onChange={(e) => handleInventoryChange(item.bloodType, 'units', e.target.value)}
                          className="input input-bordered input-xs sm:input-sm w-16 sm:w-20"
                        />
                      </td>

                      {/* Threshold - Hidden on mobile */}
                      <td className="hidden xs:table-cell">
                        <input
                          type="number"
                          min="0"
                          value={item.threshold}
                          onChange={(e) => handleInventoryChange(item.bloodType, 'threshold', e.target.value)}
                          className="input input-bordered input-xs sm:input-sm w-16 sm:w-20"
                        />
                      </td>

                      {/* Components */}
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.components.wholeBlood}
                          onChange={(e) => handleInventoryChange(item.bloodType, 'wholeBlood', e.target.value)}
                          className="input input-bordered input-xs sm:input-sm w-12 sm:w-16"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.components.plasma}
                          onChange={(e) => handleInventoryChange(item.bloodType, 'plasma', e.target.value)}
                          className="input input-bordered input-xs sm:input-sm w-12 sm:w-16"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.components.platelets}
                          onChange={(e) => handleInventoryChange(item.bloodType, 'platelets', e.target.value)}
                          className="input input-bordered input-xs sm:input-sm w-12 sm:w-16"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.components.cryoprecipitate}
                          onChange={(e) => handleInventoryChange(item.bloodType, 'cryoprecipitate', e.target.value)}
                          className="input input-bordered input-xs sm:input-sm w-12 sm:w-16"
                        />
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`font-semibold text-[10px] sm:text-xs ${statusColor}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ==================== MOBILE SUMMARY ==================== */}
          <div className="xs:hidden bg-base-200 rounded-lg p-3">
            <p className="text-xs font-medium mb-2">Low Stock Summary:</p>
            {lowStockItems.length > 0 ? (
              lowStockItems.map(item => (
                <div key={item.bloodType} className="text-[10px] mb-1">
                  {item.bloodType}: {item.units}/{item.threshold} units
                </div>
              ))
            ) : (
              <p className="text-[10px] text-base-content/50">No low stock items</p>
            )}
          </div>

          {/* ==================== QUICK ACTIONS ==================== */}
          <div className="flex flex-row gap-2 justify-end">

          </div>
        </div>

        {/* ==================== FORM ACTIONS ==================== */}
        <div className="modal-action mt-4 sm:mt-6 flex flex-col md:flex-row justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-xs sm:btn-sm order-2 xs:order-1"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-error btn-xs sm:btn-sm gap-2 order-1 xs:order-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span className="text-xs sm:text-sm">Updating...</span>
              </>
            ) : (
              <>
                <FiSave size={12} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Update Inventory</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResetAll}
            className="btn btn-outline btn-xs sm:btn-sm order-2 xs:order-1"
          >
            Reset All
          </button>
          <button
            type="button"
            onClick={handleSetMinimumStock}
            className="btn btn-outline btn-success btn-xs sm:btn-sm order-1 xs:order-2"
          >
            Set Minimum Stock
          </button>
        </div>
      </form>
    </motion.div>
  );
};


export default InventoryModal;