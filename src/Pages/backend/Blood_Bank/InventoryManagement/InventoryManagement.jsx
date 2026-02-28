// Pages/backend/BloodBank/InventoryManagement/InventoryManagement.jsx

// React
import React, { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons - Fi (Feather Icons)
import {
  FiSave,
  FiRefreshCw,
  FiAlertCircle,
  FiClock,
  FiEdit2,
  FiActivity,
  FiPackage,
  FiDownload,
} from "react-icons/fi";

// Icons - Fa (Font Awesome)
import {
  FaTint,
  FaExclamationTriangle,
  FaCheckCircle as FaCheckCircleSolid,
  FaFlask,
  FaHeartbeat,
  FaSyringe,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";
import {
  formatAppDateTime,
  formatAppTime,
  formatDateInputValue,
} from "../../../../utils/dateFormat";

// Format date for display
const formatDateTime = (value) => {
  return formatAppDateTime(value);
};

// Format time only
const formatTimeOnly = (value) => {
  return formatAppTime(value);
};

// Blood types
const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Component types
const componentTypes = [
  { id: "wholeBlood", label: "Whole Blood", icon: FaTint },
  { id: "plasma", label: "Plasma", icon: FaFlask },
  { id: "platelets", label: "Platelets", icon: FaHeartbeat },
  { id: "cryoprecipitate", label: "Cryo", icon: FaSyringe },
];

const defaultInventory = bloodTypes.map((bloodType) => ({
  bloodType,
  units: 0,
  threshold: 10,
  lastUpdated: new Date(),
  components: {
    wholeBlood: 0,
    plasma: 0,
    platelets: 0,
    cryoprecipitate: 0,
  },
}));

// Status configuration
const statusConfig = {
  CRITICAL: {
    label: "Critical",
    color: "error",
    icon: FaExclamationTriangle,
    bgColor: "bg-error/10",
    textColor: "text-error",
    borderColor: "border-error/20",
  },
  LOW: {
    label: "Low",
    color: "warning",
    icon: FiAlertCircle,
    bgColor: "bg-warning/10",
    textColor: "text-warning",
    borderColor: "border-warning/20",
  },
  ADEQUATE: {
    label: "Adequate",
    color: "info",
    icon: FiActivity,
    bgColor: "bg-info/10",
    textColor: "text-info",
    borderColor: "border-info/20",
  },
  GOOD: {
    label: "Good",
    color: "success",
    icon: FaCheckCircleSolid,
    bgColor: "bg-success/10",
    textColor: "text-success",
    borderColor: "border-success/20",
  },
};

// Calculate inventory status based on units and threshold
const calculateInventoryStatus = (units, threshold) => {
  if (units <= threshold) return "CRITICAL";
  if (units <= threshold * 2) return "LOW";
  if (units <= threshold * 3) return "ADEQUATE";
  return "GOOD";
};

const InventoryManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");
  const isBloodBankUser = user?.role === "blood_bank";

  const userId = useMemo(
    () => user?.userId || user?._id || user?.id || user?.uid,
    [user],
  );

  // Auth headers for API requests
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const {
    data: myBankData,
    isLoading: myBankLoading,
  } = useQuery({
    queryKey: ["my-blood-bank-inventory", userId, user?.role],
    enabled: !authLoading && isBloodBankUser && !!userId,
    queryFn: async () => {
      const res = await axiosInstance.get("/blood-banks/staff/me", {
        headers: authHeaders,
      });
      return res.data?.data || null;
    },
    retry: false,
  });

  // Resolve bank ID. For blood bank staff, never fall back to userId.
  const bankId = useMemo(() => {
    const profileBankId =
      user?.bankId ||
      user?.bloodBankId ||
      user?.assignedBankId ||
      user?.profile?.bankId ||
      user?.profile?.bloodBankId;

    if (isBloodBankUser) {
      return myBankData?._id || profileBankId || null;
    }

    return profileBankId || userId || null;
  }, [isBloodBankUser, myBankData, user, userId]);

  // State management
  const [draftInventory, setDraftInventory] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Form states for editing
  const [editForm, setEditForm] = useState({
    bloodType: "",
    units: 0,
    threshold: 10,
    components: {
      wholeBlood: 0,
      plasma: 0,
      platelets: 0,
      cryoprecipitate: 0,
    },
  });

  // Fetch blood bank details
  const {
    data: bankData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["blood-bank-inventory", bankId],
    enabled: !authLoading && !!bankId && (!isBloodBankUser || !myBankLoading),
    queryFn: async () => {
      if (!bankId) {
        throw new Error("Bank ID not found. Please log in again.");
      }

      const res = await axiosInstance.get(`/blood-banks/${bankId}`, {
        headers: authHeaders,
      });

      return res.data?.data;
    },
  });

  // Update inventory mutation
  const updateInventoryMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await axiosInstance.patch(
        `/blood-banks/${bankId}/inventory`,
        payload,
        { headers: authHeaders }
      );
      return response.data;
    },
    onSuccess: async () => {
      await Swal.fire({
        title: "Inventory Updated",
        text: "Blood inventory has been updated successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
      refetch();
      setEditingType(null);
      setBulkEditMode(false);
      setDraftInventory(null);
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Failed to update inventory.",
        icon: "error",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    },
  });

  const baseInventory = useMemo(
    () => (bankData?.inventory?.length ? bankData.inventory : defaultInventory),
    [bankData],
  );
  const inventory = draftInventory ?? baseInventory;

  // Process inventory with status
  const processedInventory = useMemo(() => {
    return inventory.map(item => ({
      ...item,
      status: calculateInventoryStatus(item.units || 0, item.threshold || 10),
      statusConfig: statusConfig[calculateInventoryStatus(item.units || 0, item.threshold || 10)],
    }));
  }, [inventory]);

  // Filter inventory
  const filteredInventory = useMemo(() => {
    let filtered = processedInventory;

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.bloodType.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [processedInventory, filterStatus, searchTerm]);

  // Calculate statistics
  const inventoryStats = useMemo(() => {
    const totalUnits = inventory.reduce((sum, item) => sum + (item.units || 0), 0);
    const criticalCount = processedInventory.filter(i => i.status === "CRITICAL").length;
    const lowCount = processedInventory.filter(i => i.status === "LOW").length;
    const adequateCount = processedInventory.filter(i => i.status === "ADEQUATE").length;
    const goodCount = processedInventory.filter(i => i.status === "GOOD").length;
    const activeTypes = inventory.filter(i => i.units > 0).length;

    return {
      totalUnits,
      criticalCount,
      lowCount,
      adequateCount,
      goodCount,
      activeTypes,
      totalTypes: bloodTypes.length,
    };
  }, [inventory, processedInventory]);

  // Handle edit single blood type
  const handleEdit = (bloodType) => {
    const item = inventory.find(i => i.bloodType === bloodType);
    if (item) {
      setEditForm({
        bloodType: item.bloodType,
        units: item.units || 0,
        threshold: item.threshold || 10,
        components: {
          wholeBlood: item.components?.wholeBlood || 0,
          plasma: item.components?.plasma || 0,
          platelets: item.components?.platelets || 0,
          cryoprecipitate: item.components?.cryoprecipitate || 0,
        },
      });
      setEditingType(bloodType);
    }
  };

  // Handle save single update
  const handleSaveSingle = async () => {
    await updateInventoryMutation.mutateAsync({
      bloodType: editForm.bloodType,
      units: parseInt(editForm.units, 10) || 0,
      threshold: parseInt(editForm.threshold, 10) || 0,
      components: editForm.components,
    });
  };

  // Handle bulk update
  const handleBulkUpdate = async () => {
    const updates = inventory.map(item => ({
      bloodType: item.bloodType,
      units: item.units,
      threshold: item.threshold,
      components: item.components,
    }));

    await updateInventoryMutation.mutateAsync({ updates });
  };

  // Handle reset to thresholds
  const handleResetToThreshold = () => {
    setDraftInventory((prev) => {
      const source = prev ?? baseInventory;
      return source.map((item) => ({
        ...item,
        units: Math.max(item.threshold * 2, item.units),
      }));
    });
  };

  // Handle set all to zero
  const handleSetAllZero = () => {
    Swal.fire({
      title: "Reset All Inventory?",
      text: "This will set all blood units to zero. This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, reset all",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        confirmButton: "btn btn-sm btn-error text-white",
        cancelButton: "btn btn-sm",
      },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        setDraftInventory((prev) => {
          const source = prev ?? baseInventory;
          return source.map((item) => ({
            ...item,
            units: 0,
            components: {
              wholeBlood: 0,
              plasma: 0,
              platelets: 0,
              cryoprecipitate: 0,
            },
          }));
        });
      }
    });
  };

  // Handle input change for edit form
  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: field === "units" || field === "threshold" ? (parseInt(value, 10) || 0) : value,
    }));
  };

  const handleComponentChange = (component, value) => {
    setEditForm(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [component]: parseInt(value, 10) || 0,
      },
    }));
  };

  // Handle inventory change in bulk mode
  const handleBulkChange = (bloodType, field, value) => {
    setDraftInventory((prev) => {
      const source = prev ?? baseInventory;
      return source.map((item) => {
        if (item.bloodType === bloodType) {
          if (field === 'units' || field === 'threshold') {
            return { ...item, [field]: parseInt(value, 10) || 0 };
          } else {
            // Handle component fields
            return {
              ...item,
              components: {
                ...item.components,
                [field]: parseInt(value, 10) || 0,
              },
            };
          }
        }
        return item;
      });
    });
  };

  // Handle export inventory
  const handleExport = () => {
    const exportData = processedInventory.map(item => ({
      BloodType: item.bloodType,
      Units: item.units,
      Threshold: item.threshold,
      Status: item.status,
      WholeBlood: item.components?.wholeBlood || 0,
      Plasma: item.components?.plasma || 0,
      Platelets: item.components?.platelets || 0,
      Cryoprecipitate: item.components?.cryoprecipitate || 0,
      LastUpdated: formatDateTime(item.lastUpdated),
    }));

    if (!exportData.length) {
      Swal.fire({
        title: "No Data",
        text: "There is no inventory data to export.",
        icon: "info",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-info text-white",
        },
        buttonsStyling: false,
      });
      return;
    }

    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-export-${formatDateInputValue(new Date())}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Loading state
  if (isLoading || authLoading || myBankLoading) return <BloodLoader />;

  const profileErrorStatus = error?.response?.status;
  const profileErrorMessage = error?.response?.data?.error || error?.message || "";
  const isProfileMissingError =
    isError &&
    (profileErrorStatus === 404 ||
      profileErrorStatus === 400 ||
      /blood bank not found|invalid blood bank id|no blood bank profile assigned/i.test(
        profileErrorMessage,
      ));

  const showNoProfileState =
    (!bankId && !authLoading && !myBankLoading) || isProfileMissingError;

  // No profile state
  if (showNoProfileState) {
    return (
      <div className="space-y-6 min-h-screen bg-base-200 p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FaTint className="text-error" />
              Inventory Management
            </h2>
            <p className="text-sm text-base-content/70 mt-1">
              Manage blood inventory levels and components.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="alert bg-base-100 border border-error/20 shadow-sm items-start"
        >
          <FaExclamationTriangle className="text-error mt-0.5" />
          <div>
            <h3 className="font-semibold text-error">Blood Bank Profile Not Found</h3>
            <p className="text-sm text-base-content/70 mt-1">
              No blood bank profile data is available for this account. Please contact an admin to create or link your blood bank profile.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaTint className="text-error" />
            Inventory Management
          </h2>
          <p className="text-sm text-base-content/70 mt-1">
            {bankData?.name} • Manage blood inventory levels and components
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="btn btn-sm btn-outline gap-2"
          >
            <FiDownload size={16} />
            Export
          </button>
          <button
            type="button"
            onClick={() => {
              refetch();
            }}
            className="btn btn-sm btn-outline gap-2"
            disabled={isLoading}
          >
            <FiRefreshCw className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
          {!bulkEditMode ? (
            <button
              onClick={() => {
                setBulkEditMode(true);
                setDraftInventory(
                  baseInventory.map((item) => ({
                    ...item,
                    components: { ...item.components },
                  })),
                );
              }}
              className="btn btn-sm btn-error gap-2"
            >
              <FiEdit2 size={16} />
              Bulk Edit
            </button>
          ) : (
            <button
              onClick={() => {
                setBulkEditMode(false);
                setEditingType(null);
                setDraftInventory(null);
              }}
              className="btn btn-sm btn-ghost gap-2"
            >
              Cancel Bulk Edit
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
          <div className="stat-figure text-error">
            <FaTint size={24} />
          </div>
          <div className="stat-title">Total Units</div>
          <div className="stat-value text-2xl">{inventoryStats.totalUnits}</div>
          <div className="stat-desc">Across all blood types</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
          <div className="stat-figure text-error">
            <FiPackage size={24} />
          </div>
          <div className="stat-title">Active Types</div>
          <div className="stat-value text-2xl">{inventoryStats.activeTypes}/8</div>
          <div className="stat-desc">Blood types in stock</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
          <div className="stat-figure text-error">
            <FaExclamationTriangle size={24} />
          </div>
          <div className="stat-title">Critical</div>
          <div className="stat-value text-2xl text-error">{inventoryStats.criticalCount}</div>
          <div className="stat-desc">Need immediate attention</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
          <div className="stat-figure text-warning">
            <FiAlertCircle size={24} />
          </div>
          <div className="stat-title">Low Stock</div>
          <div className="stat-value text-2xl text-warning">{inventoryStats.lowCount}</div>
          <div className="stat-desc">Below 2x threshold</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
          <div className="stat-figure text-success">
            <FaCheckCircleSolid size={24} />
          </div>
          <div className="stat-title">Good Stock</div>
          <div className="stat-value text-2xl text-success">{inventoryStats.goodCount}</div>
          <div className="stat-desc">Healthy inventory</div>
        </div>
      </motion.div>

      {/* Filters and Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by blood type..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <select
              className="select select-bordered w-full"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="CRITICAL">Critical</option>
              <option value="LOW">Low</option>
              <option value="ADEQUATE">Adequate</option>
              <option value="GOOD">Good</option>
            </select>
          </div>

          {/* Quick Actions */}
          {bulkEditMode && (
            <div className="flex gap-2">
              <button
                onClick={handleResetToThreshold}
                className="btn btn-sm btn-outline btn-info"
              >
                Set to 2x Threshold
              </button>
              <button
                onClick={handleSetAllZero}
                className="btn btn-sm btn-outline btn-error"
              >
                Reset All
              </button>
              <button
                onClick={handleBulkUpdate}
                disabled={updateInventoryMutation.isPending}
                className="btn btn-sm btn-error gap-2"
              >
                {updateInventoryMutation.isPending ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <FiSave size={16} />
                )}
                Save All Changes
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Inventory Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200">
                <th>Blood Type</th>
                <th>Status</th>
                <th>Units</th>
                <th>Threshold</th>
                <th colSpan={4} className="text-center">Components</th>
                <th>Last Updated</th>
                <th className="text-center">Actions</th>
              </tr>
              <tr className="bg-base-200 text-xs">
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th className="text-center">Whole Blood</th>
                <th className="text-center">Plasma</th>
                <th className="text-center">Platelets</th>
                <th className="text-center">Cryo</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const StatusIcon = item.statusConfig.icon;
                const isEditing = editingType === item.bloodType;

                return (
                  <motion.tr
                    key={item.bloodType}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={item.status === "CRITICAL" ? "bg-error/5" : ""}
                  >
                    <td className="font-bold text-lg">{item.bloodType}</td>

                    {/* Status */}
                    <td>
                      <span className={`badge badge-${item.statusConfig.color} gap-1`}>
                        <StatusIcon size={12} />
                        {item.statusConfig.label}
                      </span>
                    </td>

                    {/* Units */}
                    <td>
                      {isEditing || bulkEditMode ? (
                        <input
                          type="number"
                          min="0"
                          className="input input-bordered input-sm w-20"
                          value={bulkEditMode ? item.units : editForm.units}
                          onChange={(e) => {
                            if (bulkEditMode) {
                              handleBulkChange(item.bloodType, 'units', e.target.value);
                            } else {
                              handleEditFormChange('units', e.target.value);
                            }
                          }}
                        />
                      ) : (
                        <span className={`font-bold ${item.units <= item.threshold ? 'text-error' : ''}`}>
                          {item.units}
                        </span>
                      )}
                    </td>

                    {/* Threshold */}
                    <td>
                      {isEditing || bulkEditMode ? (
                        <input
                          type="number"
                          min="0"
                          className="input input-bordered input-sm w-20"
                          value={bulkEditMode ? item.threshold : editForm.threshold}
                          onChange={(e) => {
                            if (bulkEditMode) {
                              handleBulkChange(item.bloodType, 'threshold', e.target.value);
                            } else {
                              handleEditFormChange('threshold', e.target.value);
                            }
                          }}
                        />
                      ) : (
                        <span>{item.threshold}</span>
                      )}
                    </td>

                    {/* Components */}
                    {componentTypes.map((comp) => (
                      <td key={comp.id} className="text-center">
                        {isEditing || bulkEditMode ? (
                          <input
                            type="number"
                            min="0"
                            className="input input-bordered input-sm w-16"
                            value={bulkEditMode ? (item.components?.[comp.id] || 0) : (editForm.components?.[comp.id] || 0)}
                            onChange={(e) => {
                              if (bulkEditMode) {
                                handleBulkChange(item.bloodType, comp.id, e.target.value);
                              } else {
                                handleComponentChange(comp.id, e.target.value);
                              }
                            }}
                          />
                        ) : (
                          <span className="text-sm">
                            {item.components?.[comp.id] || 0}
                          </span>
                        )}
                      </td>
                    ))}

                    {/* Last Updated */}
                    <td>
                      <div className="flex items-center gap-1 text-xs">
                        <FiClock size={12} className="opacity-50" />
                        <span title={formatDateTime(item.lastUpdated)}>
                          {formatTimeOnly(item.lastUpdated)}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex justify-center gap-1">
                        {!bulkEditMode && !isEditing && (
                          <button
                            onClick={() => handleEdit(item.bloodType)}
                            className="btn btn-ghost btn-xs btn-square tooltip"
                            data-tip="Edit"
                          >
                            <FiEdit2 size={14} />
                          </button>
                        )}
                        {isEditing && (
                          <>
                            <button
                              onClick={handleSaveSingle}
                              disabled={updateInventoryMutation.isPending}
                              className="btn btn-xs btn-error gap-1"
                            >
                              {updateInventoryMutation.isPending ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                <FiSave size={12} />
                              )}
                              Save
                            </button>
                            <button
                              onClick={() => setEditingType(null)}
                              className="btn btn-xs btn-ghost"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Low Inventory Alert */}
      {inventoryStats.criticalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="alert alert-error bg-error/10 border-error/20"
        >
          <FaExclamationTriangle className="text-error" size={20} />
          <div className="flex-1">
            <span className="font-semibold">Critical Inventory Alert!</span>
            <p className="text-sm">
              {inventoryStats.criticalCount} blood type(s) have critically low inventory.
              {filteredInventory
                .filter(i => i.status === "CRITICAL")
                .map(i => ` ${i.bloodType} (${i.units}/${i.threshold})`)
                .join(', ')}
            </p>
          </div>
          <button
            onClick={() => setFilterStatus("CRITICAL")}
            className="btn btn-sm btn-error"
          >
            View Critical
          </button>
        </motion.div>
      )}

      {/* Inventory Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-info/10 border border-info/20 rounded-lg p-4 text-sm"
      >
        <div className="flex items-start gap-3">
          <FiAlertCircle className="text-info text-xl shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-info mb-1">Inventory Management Tips:</p>
            <ul className="list-disc list-inside text-base-content/70 space-y-1">
              <li><span className="font-medium text-error">Critical</span> - Below threshold, needs immediate restocking</li>
              <li><span className="font-medium text-warning">Low</span> - Between threshold and 2x threshold, plan restocking soon</li>
              <li><span className="font-medium text-info">Adequate</span> - Between 2x and 3x threshold, comfortable levels</li>
              <li><span className="font-medium text-success">Good</span> - Above 3x threshold, healthy inventory levels</li>
              <li>Update components separately to track different blood products</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InventoryManagement;
