// Pages/backend/Layout/components/MessagesDrawer.jsx

// React
import React from "react";
import { useQuery } from "@tanstack/react-query";

// Icons
import { FiMail, FiX, FiCheckCircle, FiAlertCircle, FiInfo } from "react-icons/fi";

// Hooks
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

const MessagesDrawer = ({ user, isOpen, onClose, isDesktop = false }) => {
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

  // Generate messages based on user data
  const generateMessages = () => {
    const messages = [];

    if (!data) return messages;

    // Welcome message
    messages.push({
      id: 'welcome',
      title: 'Welcome back!',
      content: `Hello ${data?.profile?.fullName || "User"}, your dashboard is ready.`,
      type: 'info',
      icon: FiInfo
    });

    // Email verification message
    if (!data?.verification?.isEmailVerified) {
      messages.push({
        id: 'email-verify',
        title: 'Email Verification Required',
        content: "Verify your email to enable trusted account status.",
        type: 'warning',
        icon: FiAlertCircle
      });
    }

    // Emergency contact message
    if (!data?.profile?.emergencyContact?.phone) {
      messages.push({
        id: 'emergency-contact',
        title: 'Emergency Contact Missing',
        content: "Add an emergency contact phone for better account safety.",
        type: 'warning',
        icon: FiAlertCircle
      });
    }

    // Address completion message
    if (!data?.address?.city) {
      messages.push({
        id: 'address',
        title: 'Complete Your Address',
        content: "Complete your address to improve matching and alerts.",
        type: 'info',
        icon: FiInfo
      });
    }

    // Blood donation eligibility (if applicable)
    if (data?.bloodType && data?.lastDonationDate) {
      const lastDonation = new Date(data.lastDonationDate);
      const nextEligible = new Date(lastDonation);
      nextEligible.setMonth(nextEligible.getMonth() + 3);

      if (new Date() >= nextEligible) {
        messages.push({
          id: 'donation-eligible',
          title: 'Ready to Donate',
          content: "You're eligible to donate blood again!",
          type: 'success',
          icon: FiCheckCircle
        });
      }
    }

    return messages;
  };

  const messages = generateMessages();

  // Desktop version (dropdown)
  if (isDesktop) {
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
          className="dropdown-content z-100 mt-2 w-80 rounded-xl border border-base-300 bg-base-100 p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Messages</p>
            <span className="text-xs text-base-content/60">
              {isLoading ? "Loading..." : `${messages.length} new`}
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {isLoading ? (
              <p className="text-sm text-base-content/70">Fetching messages...</p>
            ) : messages.length > 0 ? (
              messages.slice(0, 4).map((msg) => {
                const Icon = msg.icon;
                return (
                  <div
                    key={msg.id}
                    className={`rounded-lg p-3 text-sm ${msg.type === 'warning' ? 'bg-warning/10' :
                      msg.type === 'success' ? 'bg-success/10' :
                        'bg-info/10'
                      }`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`mt-0.5 ${msg.type === 'warning' ? 'text-warning' :
                        msg.type === 'success' ? 'text-success' :
                          'text-info'
                        }`} />
                      <div>
                        <p className="font-medium">{msg.title}</p>
                        <p className="text-xs opacity-80">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-base-content/70 text-center py-4">
                No new messages
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mobile version (drawer)
  if (!isOpen) return null;

  return (
    <>
      {/* Drawer Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <aside
        className={`fixed inset-y-0 right-0 w-80 bg-base-100 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Drawer Header */}
        <div className="h-16 px-4 border-b border-red-500 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-error/10 p-2 rounded-xl">
              <FiMail className="text-error text-xl" />
            </div>
            <h2 className="text-lg font-bold">Messages</h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-sm"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Messages Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <span className="loading loading-spinner loading-md text-error"></span>
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((msg) => {
                const Icon = msg.icon;
                return (
                  <div
                    key={msg.id}
                    className={`rounded-xl p-4 ${msg.type === 'warning' ? 'bg-warning/10 border border-warning/20' :
                      msg.type === 'success' ? 'bg-success/10 border border-success/20' :
                        'bg-info/10 border border-info/20'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${msg.type === 'warning' ? 'bg-warning/20' :
                        msg.type === 'success' ? 'bg-success/20' :
                          'bg-info/20'
                        }`}>
                        <Icon className={`${msg.type === 'warning' ? 'text-warning' :
                          msg.type === 'success' ? 'text-success' :
                            'text-info'
                          }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1">{msg.title}</h3>
                        <p className="text-sm opacity-80">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="bg-base-200 p-4 rounded-full mb-3">
                <FiMail className="text-3xl text-base-content/30" />
              </div>
              <p className="text-base-content/50">No new messages</p>
              <p className="text-xs text-base-content/30 mt-1">
                You're all caught up!
              </p>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-base-300">
          <button
            onClick={onClose}
            className="btn btn-outline btn-error w-full"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
};

export default MessagesDrawer;