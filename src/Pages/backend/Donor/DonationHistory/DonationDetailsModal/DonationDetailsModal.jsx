import React from "react";
import { FiActivity, FiAlertCircle, FiClock } from "react-icons/fi";
import { FaHospital, FaTint } from "react-icons/fa";

const DonationDetailsModal = ({ selectedDonation, formatDate, formatDateOnly, onClose }) => {
  if (!selectedDonation) return null;

  return (
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      {/* Modal Header */}
      <div className="bg-linear-to-r from-error to-error/80 p-6 -m-6 mb-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FiActivity size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">Donation Details</h3>
              <p className="text-white/80 text-sm">{formatDate(selectedDonation.date)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
          >
            X
          </button>
        </div>
      </div>

      {/* Modal Content */}
      <div className="space-y-4">
        <div className="bg-base-200 rounded-lg p-4">
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <FaTint className="text-error" />
            Donation Information
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="opacity-70">Type</p>
              <p className="font-medium capitalize">{selectedDonation.type?.replace("_", " ")}</p>
            </div>
            <div>
              <p className="opacity-70">Volume</p>
              <p className="font-medium">{selectedDonation.volume}ml</p>
            </div>
            <div>
              <p className="opacity-70">Reaction</p>
              <p>{selectedDonation.reaction || "None"}</p>
            </div>
            <div>
              <p className="opacity-70">Next Eligible</p>
              <p>
                {selectedDonation.nextEligibleDate
                  ? formatDateOnly(selectedDonation.nextEligibleDate)
                  : "Immediately"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-base-200 rounded-lg p-4">
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <FaHospital className="text-error" />
            Blood Bank Information
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <p className="opacity-70">Blood Bank ID</p>
              <p className="font-mono text-xs break-all">
                {typeof selectedDonation.bloodBankId === "object"
                  ? selectedDonation.bloodBankId.$oid
                  : selectedDonation.bloodBankId}
              </p>
            </div>
            {selectedDonation.bloodBankName && (
              <div>
                <p className="opacity-70">Blood Bank Name</p>
                <p>{selectedDonation.bloodBankName}</p>
              </div>
            )}
          </div>
        </div>

        {selectedDonation.notes && (
          <div className="bg-base-200 rounded-lg p-4">
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <FiAlertCircle className="text-error" />
              Additional Notes
            </h4>
            <p className="text-sm">{selectedDonation.notes}</p>
          </div>
        )}

        <div className="bg-base-200 rounded-lg p-4">
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <FiClock className="text-error" />
            Timeline
          </h4>
          <div className="space-y-2 text-sm">
            <p>
              <span className="opacity-70">Donation Date:</span> {formatDate(selectedDonation.date)}
            </p>
            {selectedDonation.nextEligibleDate && (
              <p>
                <span className="opacity-70">Eligible Again:</span>{" "}
                {formatDate(selectedDonation.nextEligibleDate)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="modal-action">
        <button onClick={onClose} className="btn btn-error">
          Close
        </button>
      </div>
    </div>
  );
};

export default DonationDetailsModal;
