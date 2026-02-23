// Pages/backend/Admin/BloodBanksManagement/InventoryModal.jsx

// React
import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";

// Icons
import { FiX, FiSave, FiRefreshCw } from "react-icons/fi";

// sweetalert
import Swal from "sweetalert2";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

const InventoryModal = ({ bankId, onClose, refreshBanks }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // States
  const [apiError, setApiError] = useState("");
  const [inventory, setInventory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch bank details
  const { data: bankData } = useQuery({
    queryKey: ["bank-details", bankId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/blood-banks/${bankId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!bankId,
  });

  // Initialize inventory from bank data
  useEffect(() => {
    // Blood types
    const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    if (bankData?.data?.inventory) {
      setInventory(bankData.data.inventory);
    } else {
      // Initialize with default values
      setInventory(bloodTypes.map(bloodType => ({
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
      })));
    }
  }, [bankData]);

  // Handle inventory change
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

  // Handle bulk update
  const handleSubmit = async (e) => {
    setApiError("");
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare updates
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
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
            title: "text-lg font-bold text-error",
            content: "text-base text-base-content/80",
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

  // Calculate total units
  const totalUnits = inventory.reduce((sum, item) => sum + (item.units || 0), 0);
  const lowStockItems = inventory.filter(item => item.units <= item.threshold);

  return (
    <div className="modal-box max-w-6xl bg-base-100">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-base-300">
        <div>
          <h3 className="font-bold text-xl">Manage Inventory</h3>
          <p className="text-sm text-base-content/70">
            {bankData?.data?.name} • Total Units: {totalUnits}
          </p>
        </div>
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="alert alert-warning mt-4">
          <FiRefreshCw className="animate-spin" />
          <span>
            {lowStockItems.length} blood type(s) have low inventory:
            {lowStockItems.map(item => ` ${item.bloodType} (${item.units}/${item.threshold})`).join(', ')}
          </span>
        </div>
      )}

      {/* Error Alert */}
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="py-4 max-h-[70vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Inventory Table */}
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              {/* Table Header */}
              <thead>
                <tr className="bg-base-200">
                  <th>Blood Type</th>
                  <th>Units Available</th>
                  <th>Threshold</th>
                  <th colSpan={4} className="text-center">Components</th>
                  <th>Status</th>
                </tr>
                <tr className="bg-base-200">
                  <th></th>
                  <th></th>
                  <th></th>
                  <th>Whole Blood</th>
                  <th>Plasma</th>
                  <th>Platelets</th>
                  <th>Cryo</th>
                  <th></th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {inventory.map((item) => {
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
                      <td className="font-semibold">{item.bloodType}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.units}
                          onChange={(e) => handleInventoryChange(item.bloodType, 'units', e.target.value)}
                          className="input input-bordered input-sm w-20"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.threshold}
                          onChange={(e) => handleInventoryChange(item.bloodType, 'threshold', e.target.value)}
                          className="input input-bordered input-sm w-20"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.components.wholeBlood}
                          onChange={(e) => handleInventoryChange(item.bloodType, 'wholeBlood', e.target.value)}
                          className="input input-bordered input-sm w-16"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.components.plasma}
                          onChange={(e) => handleInventoryChange(item.bloodType, 'plasma', e.target.value)}
                          className="input input-bordered input-sm w-16"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.components.platelets}
                          onChange={(e) => handleInventoryChange(item.bloodType, 'platelets', e.target.value)}
                          className="input input-bordered input-sm w-16"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.components.cryoprecipitate}
                          onChange={(e) => handleInventoryChange(item.bloodType, 'cryoprecipitate', e.target.value)}
                          className="input input-bordered input-sm w-16"
                        />
                      </td>
                      <td>
                        <span className={`font-semibold ${statusColor}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
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
              }}
              className="btn btn-sm btn-outline"
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={() => {
                setInventory(prev => prev.map(item => ({
                  ...item,
                  units: Math.max(item.threshold * 2, item.units),
                })));
              }}
              className="btn btn-sm btn-outline btn-success"
            >
              Set Minimum Stock
            </button>
          </div>
        </div>

        {/* Form Actions */}
        <div className="modal-action">
          <button
            type="button"
            onClick={onClose}
            className="btn"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-error gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Updating...
              </>
            ) : (
              <>
                <FiSave size={16} />
                Update Inventory
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryModal;