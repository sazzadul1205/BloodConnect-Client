import Swal from "sweetalert2";

const getCurrentDate = () => new Date().toISOString().split("T")[0];

const formatTimestamp = (value) => {
  if (!value) return "N/A";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "N/A";
  }
};

const sanitizeCell = (cell) => {
  if (cell === null || cell === undefined) return "";
  const value = String(cell);
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const buildReportData = (payload = {}) => {
  const {
    dateRange = "30",
    totals = {},
    summaryData = {},
    requestsData = {},
    actionStatsData = {},
    recentActivitiesData = {},
  } = payload;

  const byStatus = requestsData?.data?.byStatus || [];
  const byUrgency = requestsData?.data?.byUrgency || [];
  const actionByDay = actionStatsData?.data?.byDay || [];
  const activities = recentActivitiesData?.data || [];

  return {
    exportedAt: new Date().toISOString(),
    dateRangeDays: Number(dateRange),
    kpis: {
      totalUsers: totals.totalUsers || 0,
      totalDonors: totals.totalDonors || 0,
      totalBanks: totals.totalBanks || 0,
      verifiedBanks: totals.verifiedBanks || 0,
      totalInventory: totals.totalInventory || 0,
      lowInventoryCount: totals.lowInventoryCount || 0,
      totalRequests: totals.totalRequests || 0,
      pendingRequests: totals.pendingRequests || 0,
      fulfilledRequests: totals.fulfilledRequests || 0,
      urgentRequests: totals.urgentRequests || 0,
      completionRate: totals.completionRate || 0,
      activeEventsThisWeek: summaryData?.data?.activity?.thisWeek || 0,
    },
    requests: {
      byStatus,
      byUrgency,
    },
    actions: {
      byDay: actionByDay,
    },
    recentActivities: activities.map((entry) => ({
      id: entry?._id || "",
      timestamp: entry?.timestamp || null,
      user: entry?.user?.name || "System",
      role: entry?.user?.role || "system",
      action: entry?.action || "",
      resource: entry?.resource || "",
      ipAddress: entry?.ipAddress || "",
    })),
  };
};

export const exportDashboardToCSV = async (payload, setIsExporting) => {
  try {
    if (setIsExporting) setIsExporting(true);

    Swal.fire({
      title: "Exporting Dashboard",
      html: "Preparing your export...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
      },
    });

    const report = buildReportData(payload);
    const rows = [["Section", "Field", "Value"]];

    Object.entries(report.kpis).forEach(([key, value]) => {
      rows.push(["KPI", key, value]);
    });

    report.requests.byStatus.forEach((item) => {
      rows.push(["RequestsByStatus", item?._id || "unknown", item?.count || 0]);
    });

    report.requests.byUrgency.forEach((item) => {
      rows.push(["RequestsByUrgency", item?._id || "unknown", item?.count || 0]);
    });

    report.actions.byDay.forEach((item) => {
      rows.push([
        "ActionsByDay",
        item?._id ? formatTimestamp(item._id) : "unknown",
        item?.count || 0,
      ]);
    });

    report.recentActivities.forEach((entry) => {
      rows.push([
        "RecentActivity",
        `${entry.action} (${entry.resource})`,
        `${entry.user} | ${formatTimestamp(entry.timestamp)} | ${entry.ipAddress}`,
      ]);
    });

    const csvContent = rows
      .map((row) => row.map((cell) => sanitizeCell(cell)).join(","))
      .join("\n");

    const metadata = [
      `# Admin Dashboard Report`,
      `# Exported At: ${report.exportedAt}`,
      `# Date Range (days): ${report.dateRangeDays}`,
      `#`,
      "",
    ].join("\n");

    const blob = new Blob(["\uFEFF" + metadata + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `admin-dashboard-report-${getCurrentDate()}.csv`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    await Swal.fire({
      title: "Export Successful!",
      html: `<p class="text-sm opacity-70">Filename: ${filename}</p>`,
      icon: "success",
      timer: 2500,
      showConfirmButton: true,
      confirmButtonText: "OK",
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        confirmButton: "btn btn-sm btn-success text-white",
      },
      buttonsStyling: false,
    });
  } catch (error) {
    console.error("Dashboard CSV export error:", error);
    await Swal.fire({
      title: "Export Failed",
      text: error.message || "Failed to export dashboard report.",
      icon: "error",
      showConfirmButton: true,
      confirmButtonText: "OK",
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        confirmButton: "btn btn-sm btn-error text-white",
      },
      buttonsStyling: false,
    });
  } finally {
    if (setIsExporting) setIsExporting(false);
  }
};

export const exportDashboardToJSON = async (payload, setIsExporting) => {
  try {
    if (setIsExporting) setIsExporting(true);

    Swal.fire({
      title: "Exporting Dashboard",
      html: "Preparing your export...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
      },
    });

    const report = buildReportData(payload);
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: "application/json" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `admin-dashboard-report-${getCurrentDate()}.json`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    await Swal.fire({
      title: "Export Successful!",
      html: `<p class="text-sm opacity-70">Filename: ${filename}</p>`,
      icon: "success",
      timer: 2500,
      showConfirmButton: true,
      confirmButtonText: "OK",
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        confirmButton: "btn btn-sm btn-success text-white",
      },
      buttonsStyling: false,
    });
  } catch (error) {
    console.error("Dashboard JSON export error:", error);
    await Swal.fire({
      title: "Export Failed",
      text: error.message || "Failed to export dashboard report.",
      icon: "error",
      showConfirmButton: true,
      confirmButtonText: "OK",
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        confirmButton: "btn btn-sm btn-error text-white",
      },
      buttonsStyling: false,
    });
  } finally {
    if (setIsExporting) setIsExporting(false);
  }
};

export const showDashboardExportOptions = (payload, setIsExporting) => {
  Swal.fire({
    title: "Export Dashboard Report",
    html: `
      <div class="text-left">
        <p class="mb-4">Choose export format:</p>
        <div class="flex flex-col gap-2">
          <button id="export-dashboard-csv" class="btn btn-outline btn-success w-full">Export as CSV</button>
          <button id="export-dashboard-json" class="btn btn-outline btn-info w-full">Export as JSON</button>
        </div>
      </div>
    `,
    showConfirmButton: false,
    showCancelButton: true,
    cancelButtonText: "Cancel",
    customClass: {
      popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
      cancelButton: "btn btn-sm",
    },
    buttonsStyling: false,
    didOpen: () => {
      document
        .getElementById("export-dashboard-csv")
        ?.addEventListener("click", () => {
          Swal.close();
          exportDashboardToCSV(payload, setIsExporting);
        });

      document
        .getElementById("export-dashboard-json")
        ?.addEventListener("click", () => {
          Swal.close();
          exportDashboardToJSON(payload, setIsExporting);
        });
    },
  });
};
