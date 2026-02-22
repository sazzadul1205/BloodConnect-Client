import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "../../../hooks/useAxiosPublic";
import BloodLoader from "../../../shared/BloodLoader";
import ErrorState from "../../../shared/ErrorState";
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
  FiFilter,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiUserPlus,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from "react-icons/fi";
import { FaHeartbeat, FaUserCircle } from "react-icons/fa";
import Pagination from "../../../shared/Pagination";
import ResultsCount from "../../../shared/ResultsCount";

const UsersManagement = () => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("all"); // "all", "donors", "hospitals", "requesters", "blood_banks", "admins"
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedVerification, setSelectedVerification] = useState("");

  // Role colors and styles
  const roleConfig = {
    donor: { color: "badge-success", icon: FaHeartbeat, label: "Donor" },
    hospital: { color: "badge-info", icon: FiMapPin, label: "Hospital" },
    requester: { color: "badge-warning", icon: FiUserCheck, label: "Requester" },
    blood_bank: { color: "badge-secondary", icon: FiDroplet, label: "Blood Bank" },
    admin: { color: "badge-error", icon: FiShield, label: "Admin" },
    super_admin: { color: "badge-error", icon: FiShield, label: "Super Admin" },
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FiUsers className="text-error" />
            Users Management
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Manage all users, verify accounts, and monitor activity
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <FiDownload size={16} />
            Export
          </button>
          <button className="btn btn-error btn-sm gap-2">
            <FiUserPlus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat bg-base-100 rounded-lg shadow-sm border border-base-300 p-4">
          <div className="stat-figure text-error">
            <FiUsers size={24} />
          </div>
          <div className="stat-title">Total Users</div>
          <div className="stat-value text-3xl">{allUsers?.count || 0}</div>
          <div className="stat-desc">Active accounts</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow-sm border border-base-300 p-4">
          <div className="stat-figure text-success">
            <FaHeartbeat size={24} />
          </div>
          <div className="stat-title">Donors</div>
          <div className="stat-value text-3xl">
            {allUsers?.data?.filter(u => u.role === "donor").length || 0}
          </div>
          <div className="stat-desc">Ready to donate</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow-sm border border-base-300 p-4">
          <div className="stat-figure text-info">
            <FiMapPin size={24} />
          </div>
          <div className="stat-title">Hospitals</div>
          <div className="stat-value text-3xl">
            {allUsers?.data?.filter(u => u.role === "hospital").length || 0}
          </div>
          <div className="stat-desc">Medical facilities</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow-sm border border-base-300 p-4">
          <div className="stat-figure text-warning">
            <FiUserCheck size={24} />
          </div>
          <div className="stat-title">Requesters</div>
          <div className="stat-value text-3xl">
            {allUsers?.data?.filter(u => u.role === "requester").length || 0}
          </div>
          <div className="stat-desc">Active requests</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow-sm border border-base-300 p-4">
          <div className="stat-figure text-success">
            <FiCheckCircle size={24} />
          </div>
          <div className="stat-title">Verified</div>
          <div className="stat-value text-3xl">
            {allUsers?.data?.filter(u => u.verification?.isEmailVerified).length || 0}
          </div>
          <div className="stat-desc">Email verified</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-100 p-1 border border-base-300">
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
      </div>

      {/* Filters Section */}
      <div className="bg-base-100 rounded-lg shadow-sm border border-base-300 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
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

          {/* Role Filter */}
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

          {/* Verification Filter */}
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

          {/* Reset Filters */}
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
      </div>

      {/* Results Count */}
      <ResultsCount
        filteredUsers={filteredUsers}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        startIndex={startIndex}
        endIndex={endIndex}
        setCurrentPage={setCurrentPage}
      />

      {/* Users Table */}
      <div className="overflow-x-auto bg-base-100 rounded-lg shadow-sm border border-base-300">
        <table className="table table-zebra w-full">
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
          <tbody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user, index) => {
                const RoleIcon = roleConfig[user.role]?.icon || FiUserCheck;
                return (
                  <tr key={user._id} className="hover">
                    <td className="font-medium">{startIndex + index + 1}</td>
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
                    <td>
                      <div className={`badge ${roleConfig[user.role]?.color || "badge-ghost"} gap-1`}>
                        <RoleIcon size={12} />
                        {roleConfig[user.role]?.label || user.role}
                      </div>
                    </td>
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
                    <td>
                      {user.profile?.bloodGroup ? (
                        <div className="font-semibold text-error">
                          {user.profile.bloodGroup}
                        </div>
                      ) : (
                        <span className="text-base-content/50">—</span>
                      )}
                    </td>
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
                    <td>
                      <div className="flex items-center gap-1 text-sm">
                        <FiCalendar size={12} className="text-base-content/50" />
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex justify-center gap-1">
                        <button className="btn btn-ghost btn-sm btn-square tooltip" data-tip="View">
                          <FiEye size={16} />
                        </button>
                        <button className="btn btn-ghost btn-sm btn-square tooltip" data-tip="Edit">
                          <FiEdit2 size={16} />
                        </button>
                        <button className="btn btn-ghost btn-sm btn-square text-error tooltip" data-tip="Delete">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <FiUsers size={48} className="text-base-content/30" />
                    <h3 className="text-lg font-semibold text-base-content/70">No users found</h3>
                    <p className="text-sm text-base-content/50">
                      Try adjusting your filters or search term
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default UsersManagement;