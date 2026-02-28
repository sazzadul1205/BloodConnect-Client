export const getId = (value) => {
  if (value === null || value === undefined) return null;

  if (typeof value === "object") {
    if (value.$oid) return String(value.$oid);
    if (value._id) return getId(value._id);

    if (typeof value.toString === "function") {
      const raw = value.toString();
      if (raw && raw !== "[object Object]") {
        return String(raw);
      }
    }

    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }

  return String(value);
};
