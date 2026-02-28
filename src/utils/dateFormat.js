import { format, parseISO, isValid } from "date-fns";

const parseDateValue = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  if (typeof value === "object" && value.$date) {
    const parsed = new Date(value.$date);
    return isValid(parsed) ? parsed : null;
  }

  if (typeof value === "string") {
    const isoParsed = parseISO(value);
    if (isValid(isoParsed)) return isoParsed;

    const dateParsed = new Date(value);
    return isValid(dateParsed) ? dateParsed : null;
  }

  const parsed = new Date(value);
  return isValid(parsed) ? parsed : null;
};

export const formatAppDate = (value, pattern = "MMM d, yyyy", fallback = "N/A") => {
  const parsed = parseDateValue(value);
  if (!parsed) return fallback;
  return format(parsed, pattern);
};

export const formatAppTime = (value, pattern = "p", fallback = "N/A") => {
  const parsed = parseDateValue(value);
  if (!parsed) return fallback;
  return format(parsed, pattern);
};

export const formatAppDateTime = (value, pattern = "PPpp", fallback = "N/A") => {
  const parsed = parseDateValue(value);
  if (!parsed) return fallback;
  return format(parsed, pattern);
};

export const formatDateInputValue = (value, fallback = "") => {
  const parsed = parseDateValue(value);
  if (!parsed) return fallback;
  return format(parsed, "yyyy-MM-dd");
};
