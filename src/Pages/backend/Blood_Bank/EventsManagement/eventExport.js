// Pages/backend/BloodBank/EventsManagement/eventExport.js

import Swal from "sweetalert2";

// Format date for export
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

// Escape CSV cell
const escapeCsvCell = (cell) => {
  if (cell === null || cell === undefined) return "";
  const value = String(cell);
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

// Export events to CSV
export const exportToCSV = async (events, activeTab, setIsExporting) => {
  try {
    if (setIsExporting) setIsExporting(true);

    Swal.fire({
      title: "Exporting Events",
      html: "Preparing your export...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
      },
    });

    const eventsToExport = Array.isArray(events) ? events : [];

    if (eventsToExport.length === 0) {
      Swal.fire({
        title: "No Data",
        text: "No events found to export.",
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
      "Event ID",
      "Title",
      "Type",
      "Status",
      "Venue",
      "Address",
      "City",
      "Start Date",
      "End Date",
      "Start Time",
      "End Time",
      "Max Donors",
      "Current Registrations",
      "Walk-ins Allowed",
      "Registered Count",
      "Checked In Count",
      "Donated Count",
      "Cancelled Count",
      "Blood Types",
      "Min Age",
      "Max Age",
      "Min Weight",
      "Created Date",
    ];

    const csvRows = eventsToExport.map((event) => {
      const donors = event.registeredDonors || [];
      const registered = donors.filter((d) => d.status === "registered").length;
      const checkedIn = donors.filter((d) => d.status === "checked_in").length;
      const donated = donors.filter((d) => d.status === "donated").length;
      const cancelled = donors.filter((d) => d.status === "cancelled").length;

      return [
        event._id || "",
        event.title || "",
        event.type || "",
        event.status?.current || "",
        event.location?.venue || "",
        event.location?.address || "",
        event.location?.city || "",
        formatDateForExport(event.schedule?.startDate),
        formatDateForExport(event.schedule?.endDate),
        event.schedule?.startTime || "",
        event.schedule?.endTime || "",
        event.capacity?.maxDonors || 0,
        event.capacity?.currentRegistrations || 0,
        event.capacity?.walkIns ? "Yes" : "No",
        registered,
        checkedIn,
        donated,
        cancelled,
        (event.requirements?.bloodTypes || []).join(" | "),
        event.requirements?.minAge || 18,
        event.requirements?.maxAge || 65,
        event.requirements?.minWeight || 50,
        formatDateForExport(event.createdAt),
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
    const filterInfo = activeTab !== "all" ? `-${activeTab}` : "";
    const filename = `events-export${filterInfo}-${date}.csv`;

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
          <p class="mb-2">Exported <span class="font-semibold text-success">${eventsToExport.length}</span> events to CSV.</p>
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
      text: error.message || "Failed to export events. Please try again.",
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

// Export events to JSON
export const exportToJSON = async (events, activeTab, setIsExporting) => {
  try {
    if (setIsExporting) setIsExporting(true);

    Swal.fire({
      title: "Exporting Events",
      html: "Preparing your export...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
      },
    });

    const eventsToExport = Array.isArray(events) ? events : [];

    if (eventsToExport.length === 0) {
      Swal.fire({
        title: "No Data",
        text: "No events found to export.",
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

    const cleanedEvents = eventsToExport.map((event) => {
      const donors = event.registeredDonors || [];
      const registered = donors.filter((d) => d.status === "registered").length;
      const checkedIn = donors.filter((d) => d.status === "checked_in").length;
      const donated = donors.filter((d) => d.status === "donated").length;
      const cancelled = donors.filter((d) => d.status === "cancelled").length;

      return {
        _id: event._id,
        title: event.title,
        description: event.description,
        type: event.type,
        status: event.status,
        location: event.location,
        schedule: event.schedule,
        capacity: {
          ...event.capacity,
          currentRegistrations: event.capacity?.currentRegistrations || 0,
        },
        requirements: event.requirements,
        stats: {
          totalRegistered: donors.length,
          registered,
          checkedIn,
          donated,
          cancelled,
        },
        registeredDonors: donors.map((d) => ({
          donorId: d.donorId,
          status: d.status,
          registrationDate: d.registrationDate,
          checkInTime: d.checkInTime,
          donationId: d.donationId,
        })),
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      };
    });

    const jsonContent = JSON.stringify(cleanedEvents, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split("T")[0];
    const filterInfo = activeTab !== "all" ? `-${activeTab}` : "";
    const filename = `events-export${filterInfo}-${date}.json`;

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
          <p class="mb-2">Exported <span class="font-semibold text-success">${eventsToExport.length}</span> events to JSON.</p>
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
      text: error.message || "Failed to export events. Please try again.",
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
export const showExportOptions = (events, activeTab, setIsExporting) => {
  Swal.fire({
    title: "Export Events",
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
        exportToCSV(events, activeTab, setIsExporting);
      });
      document.getElementById("export-json")?.addEventListener("click", () => {
        Swal.close();
        exportToJSON(events, activeTab, setIsExporting);
      });
    },
  });
};
