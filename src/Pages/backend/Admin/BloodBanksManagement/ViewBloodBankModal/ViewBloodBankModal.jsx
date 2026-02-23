// Pages/backend/Admin/BloodBanksManagement/ViewBloodBankModal.jsx

import React from "react";
import {
  FiX,
  FiMapPin,
  FiPhone,
  FiMail,
  FiGlobe,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiUsers,
  FiDroplet,
  FiCalendar,
  FiStar,
  FiTool,
} from "react-icons/fi";
import { FaHospital, FaBuilding, FaHeartbeat } from "react-icons/fa";
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

import { useQuery } from "@tanstack/react-query";

const ViewBloodBankModal = ({ bankId, onClose }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // Fetch bank details
  const {
    data: bankData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bank-details-view", bankId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/blood-banks/${bankId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!bankId,
  });

  const bank = bankData?.data;

  // Bank type configuration
  const bankTypeConfig = {
    government: {
      color: "badge-primary",
      icon: FaBuilding,
      label: "Government",
    },
    private: {
      color: "badge-secondary",
      icon: FaBuilding,
      label: "Private",
    },
    ngo: {
      color: "badge-success",
      icon: FaHeartbeat,
      label: "NGO",
    },
    hospital: {
      color: "badge-info",
      icon: FaHospital,
      label: "Hospital",
    },
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get inventory status
  const getInventoryStatus = (units, threshold) => {
    if (units <= threshold) return { status: "Low", color: "text-error" };
    if (units <= threshold * 2) return { status: "Adequate", color: "text-warning" };
    return { status: "Good", color: "text-success" };
  };

  if (isLoading) {
    return (
      <div className="modal-box max-w-4xl bg-base-100">
        <div className="flex justify-center items-center py-20">
          <span className="loading loading-spinner loading-lg text-error"></span>
        </div>
      </div>
    );
  }

  if (error || !bank) {
    return (
      <div className="modal-box max-w-4xl bg-base-100">
        <div className="flex justify-between items-center pb-4 border-b border-base-300">
          <h3 className="font-bold text-xl">Error</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <FiX size={20} />
          </button>
        </div>
        <div className="py-8 text-center text-error">
          Failed to load blood bank details. Please try again.
        </div>
      </div>
    );
  }

  const TypeIcon = bankTypeConfig[bank.type]?.icon || FaBuilding;

  return (
    <div className="modal-box max-w-4xl bg-base-100">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
              <TypeIcon className="text-error text-2xl" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-xl">{bank.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className={`badge ${bankTypeConfig[bank.type]?.color} gap-1`}>
                <TypeIcon size={12} />
                {bankTypeConfig[bank.type]?.label || bank.type}
              </div>
              {bank.verification?.isVerified ? (
                <div className="badge badge-success gap-1">
                  <FiCheckCircle size={12} />
                  Verified
                </div>
              ) : (
                <div className="badge badge-warning gap-1">
                  <FiXCircle size={12} />
                  Pending Verification
                </div>
              )}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
          <FiX size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="py-4 max-h-[70vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Registration Info */}
          <div className="grid grid-cols-2 gap-4 bg-base-200 p-4 rounded-lg">
            <div>
              <p className="text-sm text-base-content/70">Registration Number</p>
              <p className="font-semibold">{bank.registrationNumber}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/70">Registered On</p>
              <p className="font-semibold">{formatDate(bank.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/70">Last Updated</p>
              <p className="font-semibold">{formatDate(bank.updatedAt)}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/70">Staff Count</p>
              <p className="font-semibold flex items-center gap-1">
                <FiUsers size={14} />
                {bank.staff?.length || 0} Members
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <FiPhone className="text-error" />
              Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <FiPhone className="text-base-content/50 mt-1" size={16} />
                <div>
                  <p className="text-sm text-base-content/70">Phone Numbers</p>
                  <div className="space-y-1">
                    {bank.contact?.phone?.map((phone, index) => (
                      <p key={index} className="font-medium">
                        {phone}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {bank.contact?.email && (
                <div className="flex items-start gap-2">
                  <FiMail className="text-base-content/50 mt-1" size={16} />
                  <div>
                    <p className="text-sm text-base-content/70">Email</p>
                    <p className="font-medium">{bank.contact.email}</p>
                  </div>
                </div>
              )}

              {bank.contact?.website && (
                <div className="flex items-start gap-2">
                  <FiGlobe className="text-base-content/50 mt-1" size={16} />
                  <div>
                    <p className="text-sm text-base-content/70">Website</p>
                    <a
                      href={bank.contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-error hover:underline"
                    >
                      {bank.contact.website}
                    </a>
                  </div>
                </div>
              )}

              {bank.contact?.emergency && (
                <div className="flex items-start gap-2">
                  <FiPhone className="text-base-content/50 mt-1" size={16} />
                  <div>
                    <p className="text-sm text-base-content/70">Emergency Contact</p>
                    <p className="font-medium text-error">{bank.contact.emergency}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <FiMapPin className="text-error" />
              Address
            </h4>
            <div className="bg-base-200 p-4 rounded-lg">
              <p className="font-medium">{bank.address?.street}</p>
              <p className="text-base-content/70">
                {bank.address?.city}, {bank.address?.state} {bank.address?.zipCode}
              </p>
              {bank.address?.coordinates?.coordinates && (
                <p className="text-sm text-base-content/50 mt-2">
                  Coordinates: {bank.address.coordinates.coordinates[0]},{" "}
                  {bank.address.coordinates.coordinates[1]}
                </p>
              )}
            </div>
          </div>

          {/* Facilities */}
          {bank.facilities?.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <FiTool className="text-error" />
                Facilities
              </h4>
              <div className="flex flex-wrap gap-2">
                {bank.facilities.map((facility, index) => (
                  <span key={index} className="badge badge-outline badge-lg">
                    {facility}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Operating Hours */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <FiClock className="text-error" />
              Operating Hours
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bank.operatingHours &&
                Object.entries(bank.operatingHours).map(([day, hours]) => {
                  if (day === 'holidays') return null;
                  const isOpen = hours.open && hours.close;
                  return (
                    <div key={day} className="flex justify-between items-center p-2 bg-base-200 rounded">
                      <span className="capitalize font-medium">{day}</span>
                      <span className={isOpen ? '' : 'text-base-content/50'}>
                        {isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Inventory Overview */}
          {bank.inventory && bank.inventory.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <FiDroplet className="text-error" />
                Inventory Overview
              </h4>
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr className="bg-base-200">
                      <th>Blood Type</th>
                      <th>Units</th>
                      <th>Threshold</th>
                      <th>Status</th>
                      <th>Components</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bank.inventory.map((item) => {
                      const status = getInventoryStatus(item.units, item.threshold);
                      return (
                        <tr key={item.bloodType}>
                          <td className="font-semibold">{item.bloodType}</td>
                          <td>{item.units}</td>
                          <td>{item.threshold}</td>
                          <td className={status.color}>{status.status}</td>
                          <td className="text-sm">
                            <span className="tooltip" data-tip={`Whole Blood: ${item.components?.wholeBlood || 0}`}>
                              WB: {item.components?.wholeBlood || 0}
                            </span>
                            {' | '}
                            <span className="tooltip" data-tip={`Plasma: ${item.components?.plasma || 0}`}>
                              P: {item.components?.plasma || 0}
                            </span>
                            {' | '}
                            <span className="tooltip" data-tip={`Platelets: ${item.components?.platelets || 0}`}>
                              PLT: {item.components?.platelets || 0}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Staff Overview */}
          {bank.staff && bank.staff.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <FiUsers className="text-error" />
                Staff Members ({bank.staff.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bank.staff.map((staff, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-base-200 rounded">
                    <div className="avatar placeholder">
                      <div className="bg-error/10 text-error rounded-full w-8">
                        <FiUsers size={16} />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">User ID: {staff.userId}</p>
                      <div className="flex gap-2 text-sm">
                        <span className="badge badge-sm">{staff.role}</span>
                        {staff.department && (
                          <span className="text-base-content/70">{staff.department}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {bank.stats && (
            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <FiStar className="text-error" />
                Statistics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat bg-base-200 rounded-lg p-3">
                  <p className="stat-title text-xs">Total Donations</p>
                  <p className="stat-value text-xl">{bank.stats.totalDonations || 0}</p>
                </div>
                <div className="stat bg-base-200 rounded-lg p-3">
                  <p className="stat-title text-xs">Total Requests</p>
                  <p className="stat-value text-xl">{bank.stats.totalRequests || 0}</p>
                </div>
                <div className="stat bg-base-200 rounded-lg p-3">
                  <p className="stat-title text-xs">Avg Response</p>
                  <p className="stat-value text-xl">{bank.stats.avgResponseTime || 'N/A'}</p>
                </div>
                <div className="stat bg-base-200 rounded-lg p-3">
                  <p className="stat-title text-xs">Rating</p>
                  <p className="stat-value text-xl">{bank.stats.rating || 0}/5</p>
                </div>
              </div>
            </div>
          )}

          {/* Verification Info */}
          {bank.verification && (
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Verification Details</h4>
              <div className="bg-base-200 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-base-content/70">Status</p>
                    <p className="font-semibold flex items-center gap-1">
                      {bank.verification.isVerified ? (
                        <>
                          <FiCheckCircle className="text-success" />
                          Verified
                        </>
                      ) : (
                        <>
                          <FiXCircle className="text-warning" />
                          Not Verified
                        </>
                      )}
                    </p>
                  </div>
                  {bank.verification.verifiedAt && (
                    <div>
                      <p className="text-sm text-base-content/70">Verified At</p>
                      <p className="font-semibold">{formatDate(bank.verification.verifiedAt)}</p>
                    </div>
                  )}
                  {bank.verification.verifiedBy && (
                    <div>
                      <p className="text-sm text-base-content/70">Verified By</p>
                      <p className="font-semibold">User ID: {bank.verification.verifiedBy}</p>
                    </div>
                  )}
                  {bank.verification.documents?.length > 0 && (
                    <div>
                      <p className="text-sm text-base-content/70">Documents</p>
                      <p className="font-semibold">{bank.verification.documents.length} uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="modal-action">
        <button onClick={onClose} className="btn">
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewBloodBankModal;