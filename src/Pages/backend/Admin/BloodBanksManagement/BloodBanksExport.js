import Swal from "sweetalert2";

// Format date for export (YYYY-MM-DD)
export const formatDateForExport = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toISOString().split("T")[0];
  } catch {
    return "N/A";
  }
};

const escapeCsvCell = (cell) => {
  if (cell === null || cell === undefined) return "";
  const value = String(cell);
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

// Export blood banks to CSV
export const exportToCSV = async (banks, setIsExporting) => {
  try {
    if (setIsExporting) setIsExporting(true);

    Swal.fire({
      title: "Exporting Blood Banks",
      html: "Preparing your export...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
      },
    });

    const banksToExport = Array.isArray(banks) ? banks : [];

    if (banksToExport.length === 0) {
      Swal.fire({
        title: "No Data",
        text: "No blood banks found to export.",
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

    const headers = [
      "Bank ID",
      "Name",
      "Registration Number",
      "Type",
      "Verified",
      "Verification Date",
      "Phone",
      "Email",
      "Website",
      "Street",
      "City",
      "State",
      "Zip Code",
      "Country",
      "Staff Count",
      "Total Inventory Units",
      "Low Inventory Types",
      "Created Date",
      "Updated Date",
    ];

    const csvRows = banksToExport.map((bank) => {
      const inventory = Array.isArray(bank.inventory) ? bank.inventory : [];
      const totalUnits = inventory.reduce((sum, item) => sum + (item.units || 0), 0);
      const lowInventoryTypes = inventory
        .filter((item) => (item.units || 0) <= (item.threshold || 0))
        .map((item) => item.bloodType)
        .join(" | ");

      return [
        bank._id || "",
        bank.name || "",
        bank.registrationNumber || "",
        bank.type || "",
        bank.verification?.isVerified ? "Yes" : "No",
        formatDateForExport(bank.verification?.verifiedAt),
        bank.contact?.phone?.[0] || "",
        bank.contact?.email || "",
        bank.contact?.website || "",
        bank.address?.street || "",
        bank.address?.city || "",
        bank.address?.state || "",
        bank.address?.zipCode || "",
        bank.address?.country || "",
        bank.staff?.length || 0,
        totalUnits,
        lowInventoryTypes || "None",
        formatDateForExport(bank.createdAt),
        formatDateForExport(bank.updatedAt),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split("T")[0];
    const filename = `blood-banks-export-${date}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    await Swal.fire({
      title: "Export Successful!",
      html: `
        <div class="text-left">
          <p class="mb-2">Exported <span class="font-semibold text-success">${banksToExport.length}</span> blood banks to CSV.</p>
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
      text: error.message || "Failed to export blood banks. Please try again.",
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

// Export blood banks to JSON
export const exportToJSON = async (banks, setIsExporting) => {
  try {
    if (setIsExporting) setIsExporting(true);

    Swal.fire({
      title: "Exporting Blood Banks",
      html: "Preparing your export...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
      },
    });

    const banksToExport = Array.isArray(banks) ? banks : [];

    if (banksToExport.length === 0) {
      Swal.fire({
        title: "No Data",
        text: "No blood banks found to export.",
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

    const cleanedBanks = banksToExport.map((bank) => {
      const inventory = Array.isArray(bank.inventory) ? bank.inventory : [];
      const totalInventoryUnits = inventory.reduce(
        (sum, item) => sum + (item.units || 0),
        0,
      );

      return {
        _id: bank._id,
        name: bank.name || "",
        registrationNumber: bank.registrationNumber || "",
        type: bank.type || "",
        verification: {
          isVerified: !!bank.verification?.isVerified,
          verifiedAt: bank.verification?.verifiedAt || null,
          verifiedBy: bank.verification?.verifiedBy || null,
        },
        contact: {
          phone: bank.contact?.phone || [],
          email: bank.contact?.email || "",
          website: bank.contact?.website || "",
        },
        address: {
          street: bank.address?.street || "",
          city: bank.address?.city || "",
          state: bank.address?.state || "",
          zipCode: bank.address?.zipCode || "",
          country: bank.address?.country || "",
          coordinates: bank.address?.coordinates || null,
        },
        staffCount: bank.staff?.length || 0,
        inventory,
        totalInventoryUnits,
        createdAt: bank.createdAt || null,
        updatedAt: bank.updatedAt || null,
      };
    });

    const jsonContent = JSON.stringify(cleanedBanks, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split("T")[0];
    const filename = `blood-banks-export-${date}.json`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    await Swal.fire({
      title: "Export Successful!",
      html: `
        <div class="text-left">
          <p class="mb-2">Exported <span class="font-semibold text-success">${banksToExport.length}</span> blood banks to JSON.</p>
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
      text: error.message || "Failed to export blood banks. Please try again.",
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
export const showExportOptions = (banks, setIsExporting) => {
  Swal.fire({
    title: "Export Blood Banks",
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
        exportToCSV(banks, setIsExporting);
      });
      document.getElementById("export-json")?.addEventListener("click", () => {
        Swal.close();
        exportToJSON(banks, setIsExporting);
      });
    },
  });
};
