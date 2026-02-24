// Pages/backend/Layout/components/MessagesDropdown.jsx

// React
import React from "react";
import { useQuery } from "@tanstack/react-query";

// Icons
import { FiMail } from "react-icons/fi";


// Hooks
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

const MessagesDropdown = ({ user }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");
  const userId = user?._id || user?.userId;

  const { data, isLoading } = useQuery({
    queryKey: ["layout-messages", userId],
    enabled: !!userId && !!token,
    queryFn: async () => {
      const res = await axiosInstance.get(`/users/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data?.data;
    },
  });

  const messages = [];

  if (data) {
    messages.push(`Hello ${data?.profile?.fullName || "User"}, your dashboard is ready.`);

    if (!data?.verification?.isEmailVerified) {
      messages.push("Verify your email to enable trusted account status.");
    }

    if (!data?.profile?.emergencyContact?.phone) {
      messages.push("Add an emergency contact phone for better account safety.");
    }

    if (!data?.address?.city) {
      messages.push("Complete your address to improve matching and alerts.");
    }
  }

  if (!messages.length && !isLoading) {
    messages.push("No new messages.");
  }

  return (
    <div className="dropdown dropdown-end">
      <button tabIndex={0} className="btn btn-ghost btn-circle relative">
        <FiMail size={18} />
        {!isLoading && messages.length > 0 && (
          <span className="badge badge-xs badge-error absolute -top-1 -right-1">
            {Math.min(messages.length, 9)}
          </span>
        )}
      </button>

      <div
        tabIndex={0}
        className="dropdown-content z-120 mt-2 w-80 rounded-xl border border-base-300 bg-base-100 p-3 shadow-xl"
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">Messages</p>
          <span className="text-xs text-base-content/60">{isLoading ? "Loading..." : `${messages.length} new`}</span>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-base-content/70">Fetching messages...</p>
          ) : (
            messages.slice(0, 4).map((msg, idx) => (
              <div key={`${msg}-${idx}`} className="rounded-lg bg-base-200 px-3 py-2 text-sm">
                {msg}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesDropdown;
