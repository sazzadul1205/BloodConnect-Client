import { getId } from "./id";

export const getUserId = (user) =>
  getId(user?.userId) ||
  getId(user?._id) ||
  getId(user?.id) ||
  getId(user?.uid) ||
  null;
