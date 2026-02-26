// Pages/frontend/Requester/BloodBanks/utils.js

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimal places
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Get color for blood type
export const getBloodTypeColor = (bloodType) => {
  const colorMap = {
    "A+": "#ef4444",
    "A-": "#f87171",
    "B+": "#3b82f6",
    "B-": "#60a5fa",
    "AB+": "#8b5cf6",
    "AB-": "#a78bfa",
    "O+": "#10b981",
    "O-": "#34d399",
  };
  return colorMap[bloodType] || "#6b7280";
};

// Get blood type compatibility
export const getCompatibleBloodTypes = (bloodType) => {
  const compatibilityMap = {
    "A+": ["A+", "A-", "O+", "O-"],
    "A-": ["A-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "AB-": ["A-", "B-", "AB-", "O-"],
    "O+": ["O+", "O-"],
    "O-": ["O-"],
  };
  return compatibilityMap[bloodType] || [];
};

// Format phone number
export const formatPhoneNumber = (phone) => {
  if (!phone) return "N/A";
  const cleaned = ("" + phone).replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return "(" + match[1] + ") " + match[2] + "-" + match[3];
  }
  return phone;
};

// Get bank status badge color
export const getBankStatusColor = (status) => {
  const statusMap = {
    verified: "success",
    pending: "warning",
    rejected: "error",
    inactive: "ghost",
  };
  return statusMap[status] || "ghost";
};
