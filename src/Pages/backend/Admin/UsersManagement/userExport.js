import Swal from "sweetalert2";
import { FiDownload } from "react-icons/fi";

// Format date for export (YYYY-MM-DD)
export const formatDateForExport = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toISOString().split("T")[0];
  } catch {
    return "N/A";
  }
};

// Export users to CSV
export const exportToCSV = async (users, activeTab, setIsExporting) => {
  try {
    if (setIsExporting) setIsExporting(true);

    // Show loading alert
    Swal.fire({
      title: "Exporting Users",
      html: "Preparing your export...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
      },
    });

    const usersToExport = users;

    if (usersToExport.length === 0) {
      Swal.fire({
        title: "No Data",
        text: "No users found to export.",
        icon: "warning",
        timer: 2000,
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          title: "text-lg font-bold text-warning",
          confirmButton: "btn btn-sm btn-warning",
        },
        buttonsStyling: false,
      });
      return;
    }

    // Define CSV headers
    const headers = [
      "User ID",
      "Full Name",
      "Username",
      "Email",
      "Phone",
      "Role",
      "Blood Group",
      "Gender",
      "Date of Birth",
      "Weight (kg)",
      "Street Address",
      "City",
      "State",
      "Zip Code",
      "Country",
      "Email Verified",
      "Phone Verified",
      "Identity Verified",
      "Status",
      "Joined Date",
      "Last Active",
      "Total Donations",
      "Total Requests",
      "Reputation Score",
      "Response Rate",
    ];

    // Map user data to CSV rows
    const csvRows = usersToExport.map((user) => {
      const profile = user.profile || {};
      const address = user.address || {};
      const verification = user.verification || {};
      const stats = user.stats || {};

      return [
        user._id || "",
        profile.fullName || "",
        user.username || "",
        user.email || "",
        user.phone || "",
        user.role || "",
        profile.bloodGroup || "",
        profile.gender || "",
        formatDateForExport(profile.dateOfBirth),
        profile.weight || "",
        address.street || "",
        address.city || "",
        address.state || "",
        address.zipCode || "",
        address.country || "",
        verification.isEmailVerified ? "Yes" : "No",
        verification.isPhoneVerified ? "Yes" : "No",
        verification.isIdentityVerified ? "Yes" : "No",
        user.isDeleted ? "Deleted" : "Active",
        formatDateForExport(user.createdAt),
        formatDateForExport(stats.lastActive),
        stats.totalDonations || 0,
        stats.totalRequests || 0,
        stats.reputation || 100,
        stats.responseRate || 0,
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) =>
        row
          .map((cell) => {
            // Handle commas in cell values by wrapping in quotes
            if (
              typeof cell === "string" &&
              (cell.includes(",") || cell.includes('"'))
            ) {
              // Escape quotes by doubling them
              const escapedCell = cell.replace(/"/g, '""');
              return `"${escapedCell}"`;
            }
            return cell;
          })
          .join(","),
      ),
    ].join("\n");

    // Create download link
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    }); // Add BOM for UTF-8
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    // Generate filename with current date and filter info
    const date = new Date().toISOString().split("T")[0];
    const filterInfo = activeTab !== "all" ? `-${activeTab}` : "";
    const filename = `users-export${filterInfo}-${date}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show success message
    await Swal.fire({
      title: "Export Successful!",
      html: `
        <div class="text-left">
          <p class="mb-2">Exported <span class="font-semibold text-success">${usersToExport.length}</span> users to CSV.</p>
          <p class="text-sm opacity-70">Filename: ${filename}</p>
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
  } catch (error) {
    console.error("Export error:", error);
    await Swal.fire({
      title: "Export Failed",
      text: error.message || "Failed to export users. Please try again.",
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
  } finally {
    if (setIsExporting) setIsExporting(false);
  }
};

// Export users to JSON
export const exportToJSON = async (users, activeTab, setIsExporting) => {
  try {
    if (setIsExporting) setIsExporting(true);

    // Show loading alert
    Swal.fire({
      title: "Exporting Users",
      html: "Preparing your export...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
      },
    });

    const usersToExport = users;

    if (usersToExport.length === 0) {
      Swal.fire({
        title: "No Data",
        text: "No users found to export.",
        icon: "warning",
        timer: 2000,
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          title: "text-lg font-bold text-warning",
          confirmButton: "btn btn-sm btn-warning",
        },
        buttonsStyling: false,
      });
      return;
    }

    // Create a cleaned version of the data for JSON export
    const cleanedUsers = usersToExport.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isDeleted: user.isDeleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: {
        fullName: user.profile?.fullName || "",
        bloodGroup: user.profile?.bloodGroup || "",
        gender: user.profile?.gender || "",
        dateOfBirth: user.profile?.dateOfBirth || "",
        weight: user.profile?.weight || "",
        profilePicture: user.profile?.profilePicture || "",
        emergencyContact: user.profile?.emergencyContact || {},
      },
      address: {
        street: user.address?.street || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        zipCode: user.address?.zipCode || "",
        country: user.address?.country || "",
      },
      verification: {
        isEmailVerified: user.verification?.isEmailVerified || false,
        isPhoneVerified: user.verification?.isPhoneVerified || false,
        isIdentityVerified: user.verification?.isIdentityVerified || false,
        verifiedAt: user.verification?.verifiedAt || null,
      },
      stats: {
        totalDonations: user.stats?.totalDonations || 0,
        totalRequests: user.stats?.totalRequests || 0,
        lastActive: user.stats?.lastActive || null,
        reputation: user.stats?.reputation || 100,
        responseRate: user.stats?.responseRate || 0,
      },
      settings: {
        notifications: user.settings?.notifications || {},
        privacy: user.settings?.privacy || {},
      },
    }));

    // Create JSON blob
    const jsonContent = JSON.stringify(cleanedUsers, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    // Generate filename
    const date = new Date().toISOString().split("T")[0];
    const filterInfo = activeTab !== "all" ? `-${activeTab}` : "";
    const filename = `users-export${filterInfo}-${date}.json`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show success message
    await Swal.fire({
      title: "Export Successful!",
      html: `
        <div class="text-left">
          <p class="mb-2">Exported <span class="font-semibold text-success">${usersToExport.length}</span> users to JSON.</p>
          <p class="text-sm opacity-70">Filename: ${filename}</p>
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
  } catch (error) {
    console.error("Export error:", error);
    await Swal.fire({
      title: "Export Failed",
      text: error.message || "Failed to export users. Please try again.",
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
  } finally {
    if (setIsExporting) setIsExporting(false);
  }
};

// Show export options modal
export const showExportOptions = (users, activeTab, setIsExporting) => {
  Swal.fire({
    title: "Export Users",
    html: `
      <div class="text-left">
        <p class="mb-4">Choose export format:</p>
        <div class="flex flex-col gap-2">
          <button id="export-csv" class="btn btn-outline btn-success w-full gap-2">
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 16L16 12 13 12 13 4 11 4 11 12 8 12 12 16z"></path>
              <path d="M20,18v2H4v-2H2v2c0,1.103,0.897,2,2,2h16c1.103,0,2-0.897,2-2v-2H20z"></path>
            </svg>
            Export as CSV
          </button>
          <button id="export-json" class="btn btn-outline btn-info w-full gap-2">
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 16L16 12 13 12 13 4 11 4 11 12 8 12 12 16z"></path>
              <path d="M20,18v2H4v-2H2v2c0,1.103,0.897,2,2,2h16c1.103,0,2-0.897,2-2v-2H20z"></path>
            </svg>
            Export as JSON
          </button>
        </div>
      </div>
    `,
    showConfirmButton: false,
    showCancelButton: true,
    cancelButtonText: "Cancel",
    customClass: {
      popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
      title: "text-lg font-bold",
      htmlContainer: "text-base text-base-content/80",
      cancelButton: "btn btn-sm",
    },
    buttonsStyling: false,
    didOpen: () => {
      document.getElementById("export-csv")?.addEventListener("click", () => {
        Swal.close();
        exportToCSV(users, activeTab, setIsExporting);
      });
      document.getElementById("export-json")?.addEventListener("click", () => {
        Swal.close();
        exportToJSON(users, activeTab, setIsExporting);
      });
    },
  });
};
