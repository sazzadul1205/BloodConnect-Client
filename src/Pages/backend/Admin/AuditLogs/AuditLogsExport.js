// Pages/backend/Admin/AuditLogs/AuditLogsExport.js

import Swal from "sweetalert2";

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

// Format timestamp with time
export const formatTimestampForExport = (timestamp) => {
  if (!timestamp) return "N/A";
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "N/A";
    return date
      .toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(",", "");
  } catch {
    return "N/A";
  }
};

// Export audit logs to CSV
export const exportToCSV = async (logs, filters = {}, setIsExporting) => {
  try {
    if (setIsExporting) setIsExporting(true);

    // Show loading alert
    Swal.fire({
      title: "Exporting Audit Logs",
      html: "Preparing your export...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
      },
    });

    const logsToExport = logs;

    if (logsToExport.length === 0) {
      Swal.fire({
        title: "No Data",
        text: "No audit logs found to export.",
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
      "Log ID",
      "Timestamp",
      "Date",
      "Time",
      "User Name",
      "User Email",
      "User Role",
      "Action",
      "Resource",
      "Resource ID",
      "IP Address",
      "User Agent",
      "Changes Summary",
    ];

    // Map log data to CSV rows
    const csvRows = logsToExport.map((log) => {
      const timestamp = log.timestamp ? new Date(log.timestamp) : null;
      const dateStr = timestamp ? formatDateForExport(timestamp) : "N/A";
      const timeStr = timestamp
        ? timestamp.toLocaleTimeString("en-US", { hour12: false })
        : "N/A";

      // Format changes summary
      let changesSummary = "";
      if (log.changes) {
        changesSummary = Object.entries(log.changes)
          .map(([field, value]) => {
            const oldVal =
              typeof value.old === "object"
                ? JSON.stringify(value.old)
                : value.old;
            const newVal =
              typeof value.new === "object"
                ? JSON.stringify(value.new)
                : value.new;
            return `${field}: ${oldVal || "null"} → ${newVal || "null"}`;
          })
          .join("; ");
      }

      return [
        log._id || "",
        timestamp ? timestamp.toISOString() : "",
        dateStr,
        timeStr,
        log.user?.name || "System",
        log.user?.email || "system@internal",
        log.user?.role || "system",
        log.action || "",
        log.resource || "",
        log.resourceId || "",
        log.ipAddress || "",
        log.userAgent ? log.userAgent.replace(/,/g, " ") : "",
        changesSummary,
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
              (cell.includes(",") || cell.includes('"') || cell.includes("\n"))
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

    // Add metadata as comments at the top
    const metadata = [
      `# Audit Logs Export`,
      `# Exported At: ${new Date().toISOString()}`,
      `# Total Logs: ${logsToExport.length}`,
      `# Filters: ${JSON.stringify(filters)}`,
      `#`,
      "",
    ].join("\n");

    const finalCsvContent = metadata + csvContent;

    // Create download link
    const blob = new Blob(["\uFEFF" + finalCsvContent], {
      type: "text/csv;charset=utf-8;",
    }); // Add BOM for UTF-8
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    // Generate filename with current date and filter info
    const date = new Date().toISOString().split("T")[0];
    const filterInfo = filters.action ? `-${filters.action.toLowerCase()}` : "";
    const filename = `audit-logs${filterInfo}-${date}.csv`;

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
          <p class="mb-2">Exported <span class="font-semibold text-success">${logsToExport.length}</span> audit logs to CSV.</p>
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
      text: error.message || "Failed to export audit logs. Please try again.",
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

// Export audit logs to JSON
export const exportToJSON = async (logs, filters = {}, setIsExporting) => {
  try {
    if (setIsExporting) setIsExporting(true);

    // Show loading alert
    Swal.fire({
      title: "Exporting Audit Logs",
      html: "Preparing your export...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
      },
    });

    const logsToExport = logs;

    if (logsToExport.length === 0) {
      Swal.fire({
        title: "No Data",
        text: "No audit logs found to export.",
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
    const cleanedLogs = logsToExport.map((log) => ({
      _id: log._id,
      timestamp: log.timestamp,
      formattedTimestamp: formatTimestampForExport(log.timestamp),
      userId: log.userId,
      user: log.user
        ? {
            name: log.user.name || "N/A",
            email: log.user.email || "N/A",
            role: log.user.role || "N/A",
          }
        : {
            name: "System",
            email: "system@internal",
            role: "system",
          },
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId || null,
      changes: log.changes || null,
      ipAddress: log.ipAddress || "N/A",
      userAgent: log.userAgent || "N/A",
    }));

    // Create export object with metadata
    const exportData = {
      exportedAt: new Date().toISOString(),
      filters: filters,
      totalLogs: cleanedLogs.length,
      logs: cleanedLogs,
    };

    // Create JSON blob
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    // Generate filename
    const date = new Date().toISOString().split("T")[0];
    const filterInfo = filters.action ? `-${filters.action.toLowerCase()}` : "";
    const filename = `audit-logs${filterInfo}-${date}.json`;

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
          <p class="mb-2">Exported <span class="font-semibold text-success">${logsToExport.length}</span> audit logs to JSON.</p>
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
      text: error.message || "Failed to export audit logs. Please try again.",
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
export const showExportOptions = (logs, filters = {}, setIsExporting) => {
  Swal.fire({
    title: "Export Audit Logs",
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
        exportToCSV(logs, filters, setIsExporting);
      });
      document.getElementById("export-json")?.addEventListener("click", () => {
        Swal.close();
        exportToJSON(logs, filters, setIsExporting);
      });
    },
  });
};
