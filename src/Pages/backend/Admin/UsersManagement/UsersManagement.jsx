// Pages/backend/Admin/UsersManagement/UsersManagement.jsx

// React
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion} from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiMail,
  FiPhone,
  FiCalendar,
  FiDroplet,
  FiMapPin,
  FiShield,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiRefreshCw,
  FiDownload,
  FiUserPlus,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import { FaHeartbeat, FaUserCircle } from "react-icons/fa";

// Hooks
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import Pagination from "../../../../shared/Pagination";
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";
import ResultsCount from "../../../../shared/ResultsCount";

// Services
import { showExportOptions } from "./userExport";

// Modals
import AddUserModal from "./AddUserModal/AddUserModal";
import EditUserModal from "./EditUserModal/EditUserModal";
import ViewUserModal from "./ViewUserModal/ViewUserModal";

const UsersManagement = () => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // Pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRole, setSelectedRole] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedVerification, setSelectedVerification] = useState("");

  // Role colors and styles
  const roleConfig = {
    admin: { color: "badge-error", icon: FiShield, label: "Admin" },
    hospital: { color: "badge-info", icon: FiMapPin, label: "Hospital" },
    donor: { color: "badge-success", icon: FaHeartbeat, label: "Donor" },
    super_admin: { color: "badge-error", icon: FiShield, label: "Super Admin" },
    requester: { color: "badge-warning", icon: FiUserCheck, label: "Requester" },
    blood_bank: { color: "badge-secondary", icon: FiDroplet, label: "Blood Bank" },
  };

  // 🔹 Fetch All Users
  const {
    data: allUsers,
    isLoading: loadingUsers,
    isError: usersError,
    error: usersErrorData,
    refetch: usersRefetch,
  } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const res = await axiosInstance.get("/users/admin/all-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Filter users based on tab, search, role, and verification
  const getFilteredUsers = () => {
    if (!allUsers?.data) return [];

    let filtered = allUsers.data;

    // Filter by tab (user type)
    if (activeTab !== "all") {
      if (activeTab === "donors") {
        filtered = filtered.filter(user => user.role === "donor");
      } else if (activeTab === "hospitals") {
        filtered = filtered.filter(user => user.role === "hospital");
      } else if (activeTab === "requesters") {
        filtered = filtered.filter(user => user.role === "requester");
      } else if (activeTab === "blood_banks") {
        filtered = filtered.filter(user => user.role === "blood_bank");
      } else if (activeTab === "admins") {
        filtered = filtered.filter(user => user.role === "admin" || user.role === "super_admin");
      }
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.profile?.fullName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phone?.includes(term) ||
        user.profile?.bloodGroup?.toLowerCase().includes(term)
      );
    }

    // Filter by role
    if (selectedRole) {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Filter by verification status
    if (selectedVerification) {
      if (selectedVerification === "verified") {
        filtered = filtered.filter(user => user.verification?.isEmailVerified);
      } else if (selectedVerification === "unverified") {
        filtered = filtered.filter(user => !user.verification?.isEmailVerified);
      }
    }

    return filtered;
  };

  const filteredUsers = getFilteredUsers();

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get verification badge
  const getVerificationBadge = (user) => {
    const isVerified = user.verification?.isEmailVerified;
    return isVerified ? (
      <div className="badge badge-success gap-1">
        <FiCheckCircle size={12} />
        Verified
      </div>
    ) : (
      <div className="badge badge-ghost gap-1">
        <FiXCircle size={12} />
        Unverified
      </div>
    );
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle export button click
  const handleExport = () => {
    showExportOptions(filteredUsers, activeTab, setIsExporting);
  };

  // Delete user handler with SweetAlert2
  const handleDeleteUser = async (userId, userName) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        html: `
          <div class="text-left">
            <p class="mb-3">You are about to delete user:</p>
            <p class="font-semibold text-error">${userName}</p>
            <p class="mt-3 text-sm opacity-70">This action will deactivate the user account. The user will no longer be able to access the system.</p>
            <p class="text-sm font-semibold text-warning">This action can be reversed by an admin.</p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete user",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          title: "text-lg font-bold text-error",
          htmlContainer: "text-base text-base-content/80",
          confirmButton: "btn btn-sm btn-error text-white",
          cancelButton: "btn btn-sm",
        },
        buttonsStyling: false,
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          setIsDeleting(true);
          try {
            const response = await axiosInstance.delete(`/users/${userId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success) {
              return response.data;
            } else {
              throw new Error(response.data?.error || "Failed to delete user");
            }
          } catch (error) {
            Swal.showValidationMessage(
              error.response?.data?.error || error.message || "Failed to delete user"
            );
            throw error;
          } finally {
            setIsDeleting(false);
          }
        },
        allowOutsideClick: () => !Swal.isLoading()
      });

      if (result.isConfirmed) {
        await Swal.fire({
          title: "Deleted!",
          html: `
            <div class="text-center">
              <p class="mb-2">User <span class="font-semibold text-error">${userName}</span> has been deleted successfully.</p>
              <p class="text-sm opacity-70">The user account has been deactivated.</p>
            </div>
          `,
          icon: "success",
          timer: 3000,
          showConfirmButton: true,
          confirmButtonColor: "#22c55e",
          confirmButtonText: "OK",
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
            title: "text-lg font-bold text-success",
            htmlContainer: "text-base text-base-content/80",
            confirmButton: "btn btn-sm btn-success text-white",
          },
          buttonsStyling: false,
        });

        // Refresh the users list
        usersRefetch();
      }
    } catch (error) {
      console.error("Delete error:", error);
      await Swal.fire({
        title: "Error!",
        text: error.response?.data?.error || "Failed to delete user. Please try again.",
        icon: "error",
        timer: 3000,
        showConfirmButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "OK",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          title: "text-lg font-bold text-error",
          content: "text-base text-base-content/80",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    }
  };

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, selectedRole, selectedVerification]);

  // Loading state
  if (loadingUsers) return <BloodLoader />;

  // Error state
  if (usersError) {
    return (
      <ErrorState
        error={usersErrorData}
        onRetry={() => usersRefetch()}
      />
    );
  }

  const CloseModal = () => {
    setSelectedUserId(null);
    document.getElementById('add_user_modal')?.close();
    document.getElementById('view_user_modal')?.close();
    document.getElementById('edit_user_modal')?.close();
  };

  return (
    <div className="space-y-6">
      {/* Header Section with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        {/* Header copy: communicates context and purpose of user management dashboard. */}
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {/* Visual identity icon for user management system. */}
            <FiUsers className="text-error" />
            Users Management
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Manage all users, verify accounts, and monitor activity
          </p>
        </div>

        {/* Action Buttons: export and add user utilities. */}
        <div className="flex gap-2">
          {/* Export Button with Count: exports current filtered user set. */}
          <button
            onClick={handleExport}
            className="btn btn-outline btn-sm gap-2"
            disabled={isExporting || filteredUsers.length === 0}
          >
            {isExporting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Exporting...
              </>
            ) : (
              <>
                <FiDownload size={16} />
                Export ({filteredUsers.length})
              </>
            )}
          </button>

          {/* Add User Button: opens modal for new user creation. */}
          <button
            onClick={() => document.getElementById('add_user_modal')?.showModal()}
            className="btn btn-error btn-sm gap-2"
          >
            <FiUserPlus size={16} />
            Add User
          </button>
        </div>
      </motion.div>

      {/* Stats Cards with Staggered Fade In */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1 // Each card fades in sequentially with 0.1s delay
            }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {/* Card 1: Total Users - overall account count. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-error">
            <FiUsers size={24} />
          </div>
          <p className="stat-title">Total Users</p>
          <p className="stat-value text-3xl">{allUsers?.count || 0}</p>
          <p className="stat-desc">Active accounts</p>
        </motion.div>

        {/* Card 2: Donors - blood donor count with success color. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-success">
            <FaHeartbeat size={24} />
          </div>
          <p className="stat-title">Donors</p>
          <p className="stat-value text-3xl">{allUsers?.data?.filter(u => u.role === "donor").length || 0}</p>
          <p className="stat-desc">Ready to donate</p>
        </motion.div>

        {/* Card 3: Hospitals - medical facilities count. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-info">
            <FiMapPin size={24} />
          </div>
          <p className="stat-title">Hospitals</p>
          <p className="stat-value text-3xl">{allUsers?.data?.filter(u => u.role === "hospital").length || 0}</p>
          <p className="stat-desc">Medical facilities</p>
        </motion.div>

        {/* Card 4: Requesters - users requesting blood. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-warning">
            <FiUserCheck size={24} />
          </div>
          <p className="stat-title">Requesters</p>
          <p className="stat-value text-3xl">{allUsers?.data?.filter(u => u.role === "requester").length || 0}</p>
          <p className="stat-desc">Active requests</p>
        </motion.div>

        {/* Card 5: Verified - email-verified users count. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-success">
            <FiCheckCircle size={24} />
          </div>
          <p className="stat-title">Verified</p>
          <p className="stat-value text-3xl">{allUsers?.data?.filter(u => u.verification?.isEmailVerified).length || 0}</p>
          <p className="stat-desc">Email verified</p>
        </motion.div>
      </motion.div>

      {/* Tabs with Fade In - role-based filtering navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="tabs tabs-boxed bg-base-100 p-1 border border-base-300 overflow-x-auto flex-nowrap"
      >
        <button
          className={`tab tab-sm ${activeTab === "all" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Users
        </button>
        <button
          className={`tab tab-sm ${activeTab === "donors" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("donors")}
        >
          Donors
        </button>
        <button
          className={`tab tab-sm ${activeTab === "hospitals" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("hospitals")}
        >
          Hospitals
        </button>
        <button
          className={`tab tab-sm ${activeTab === "requesters" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("requesters")}
        >
          Requesters
        </button>
        <button
          className={`tab tab-sm ${activeTab === "blood_banks" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("blood_banks")}
        >
          Blood Banks
        </button>
        <button
          className={`tab tab-sm ${activeTab === "admins" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("admins")}
        >
          Admins
        </button>
      </motion.div>

      {/* Filters Section with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search input: free-text search across user fields. */}
          <div className="flex-1">
            <div className="form-control">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search by name, email, phone, blood group..."
                  className="input input-bordered w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Role Filter: dropdown for role-based filtering. */}
          <div className="w-full lg:w-48">
            <select
              className="select select-bordered w-full"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="donor">Donors</option>
              <option value="hospital">Hospitals</option>
              <option value="requester">Requesters</option>
              <option value="blood_bank">Blood Banks</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* Verification Filter: filters by email verification status. */}
          <div className="w-full lg:w-48">
            <select
              className="select select-bordered w-full"
              value={selectedVerification}
              onChange={(e) => setSelectedVerification(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          {/* Reset Filters: clears all filter inputs. */}
          <button
            className="btn btn-outline btn-square"
            onClick={() => {
              setSearchTerm("");
              setSelectedRole("");
              setSelectedVerification("");
              setActiveTab("all");
            }}
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </motion.div>

      {/* Results Count with Fade In: shows current range and total items. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <ResultsCount
          endIndex={endIndex}
          startIndex={startIndex}
          itemsPerPage={itemsPerPage}
          filteredUsers={filteredUsers}
          setCurrentPage={setCurrentPage}
          setItemsPerPage={setItemsPerPage}
        />
      </motion.div>

      {/* Main Users Table with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="overflow-x-auto bg-base-100 rounded-lg shadow-lg border border-base-300"
      >
        <table className="table table-zebra w-full">
          {/* Table Header: column definitions for user data. */}
          <thead>
            <tr className="bg-base-200">
              <th className="w-12">#</th>
              <th>User</th>
              <th>Role</th>
              <th>Contact</th>
              <th>Blood Group</th>
              <th>Location</th>
              <th>Status</th>
              <th>Joined</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          {/* Table Body with staggered row animations */}
          <tbody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user, index) => {
                const RoleIcon = roleConfig[user.role]?.icon || FiUserCheck;
                const userName = user.profile?.fullName || user.email || "Unknown User";

                return (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.35 + index * 0.02 }}
                    className="hover"
                  >
                    {/* User Index: sequential number with pagination offset. */}
                    <td className="font-medium">{startIndex + index + 1}</td>

                    {/* User Details: avatar + name + username */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                            {user.profile?.profilePicture ? (
                              <img
                                src={user.profile.profilePicture}
                                alt={user.profile?.fullName}
                                className="rounded-full"
                              />
                            ) : (
                              <FaUserCircle className="text-error text-2xl" />
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold">
                            {user.profile?.fullName || "N/A"}
                          </div>
                          <div className="text-sm text-base-content/70">
                            @{user.username || "username"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* User Role: color-coded badge with icon */}
                    <td>
                      <div className={`badge ${roleConfig[user.role]?.color || "badge-ghost"} gap-1`}>
                        <RoleIcon size={12} />
                        {roleConfig[user.role]?.label || user.role}
                      </div>
                    </td>

                    {/* User Contact: email and phone with icons */}
                    <td>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <FiMail size={12} className="text-base-content/50" />
                          <span className="truncate max-w-37.5">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <FiPhone size={12} className="text-base-content/50" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* User Blood Group: highlighted in error color */}
                    <td>
                      {user.profile?.bloodGroup ? (
                        <div className="font-semibold text-error">
                          {user.profile.bloodGroup}
                        </div>
                      ) : (
                        <span className="text-base-content/50">—</span>
                      )}
                    </td>

                    {/* User Location: city with map pin icon */}
                    <td>
                      {user.address?.city ? (
                        <div className="flex items-center gap-1 text-sm">
                          <FiMapPin size={12} className="text-base-content/50" />
                          <span>{user.address.city}</span>
                        </div>
                      ) : (
                        <span className="text-base-content/50">—</span>
                      )}
                    </td>

                    {/* User Status: verification badge + deletion indicator */}
                    <td>
                      <div className="space-y-1">
                        {getVerificationBadge(user)}
                        {user.isDeleted && (
                          <div className="badge badge-error gap-1">
                            <FiUserX size={12} />
                            Deleted
                          </div>
                        )}
                      </div>
                    </td>

                    {/* User Joined: creation date formatted */}
                    <td>
                      <div className="flex items-center gap-1 text-sm">
                        <FiCalendar size={12} className="text-base-content/50" />
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </td>

                    {/* Actions: view, edit, delete buttons */}
                    <td>
                      <div className="flex justify-center gap-1">
                        {/* View button - opens detail modal */}
                        <button
                          onClick={() => {
                            setSelectedUserId(user?._id);
                            document.getElementById('view_user_modal')?.showModal();
                          }}
                          className="btn btn-ghost btn-sm btn-square tooltip"
                          data-tip="View"
                          disabled={isDeleting || isExporting}
                        >
                          <FiEye size={16} />
                        </button>

                        {/* Edit button - opens edit modal */}
                        <button
                          onClick={() => {
                            setSelectedUserId(user?._id);
                            document.getElementById('edit_user_modal')?.showModal();
                          }}
                          className="btn btn-ghost btn-sm btn-square tooltip"
                          data-tip="Edit"
                          disabled={isDeleting || isExporting}
                        >
                          <FiEdit2 size={16} />
                        </button>

                        {/* Delete button - triggers delete confirmation */}
                        <button
                          onClick={() => handleDeleteUser(user._id, userName)}
                          className="btn btn-ghost btn-sm btn-square text-error tooltip"
                          data-tip="Delete"
                          disabled={isDeleting || isExporting}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            ) : (
              // Empty state with animation
              <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <td colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <FiUsers size={48} className="text-base-content/30" />
                    <h3 className="text-lg font-semibold text-base-content/70">No users found</h3>
                    <p className="text-sm text-base-content/50">
                      Try adjusting your filters or search term
                    </p>
                  </div>
                </td>
              </motion.tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Pagination with Fade In */}
      {filteredUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </motion.div>
      )}

      {/* Add User Modal - dialog with backdrop click close */}
      <dialog id="add_user_modal" className="modal">
        <AddUserModal
          onClose={() => CloseModal()}
          refreshUsers={() => usersRefetch()}
        />
        <form onClick={() => CloseModal()} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* Edit User Modal - dialog with backdrop click close */}
      <dialog id="edit_user_modal" className="modal">
        <EditUserModal
          userId={selectedUserId}
          onClose={() => CloseModal()}
          refreshUsers={() => usersRefetch()}
        />
        <form onClick={() => CloseModal()} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* View User Modal - dialog with backdrop click close */}
      <dialog id="view_user_modal" className="modal">
        <ViewUserModal
          userId={selectedUserId}
          onClose={() => CloseModal()}
        />
        <form onClick={() => CloseModal()} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default UsersManagement;