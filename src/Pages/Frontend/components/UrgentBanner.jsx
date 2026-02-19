import React from "react";
import { FaAmbulance } from "react-icons/fa";

const UrgentBanner = () => {
  const urgentRequests = [
    { bloodType: "O-", hospital: "City General Hospital", urgency: "Critical", distance: "2.5 km" },
    { bloodType: "B+", hospital: "Memorial Medical Center", urgency: "High", distance: "5 km" },
    { bloodType: "AB+", hospital: "Children's Hospital", urgency: "Urgent", distance: "3.2 km" }
  ];

  return (
    <section id="urgent-requests" className="bg-error text-error-content py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FaAmbulance className="text-2xl animate-pulse" />
            <span className="font-bold">URGENT NEEDS:</span>
          </div>

          <div className="flex flex-wrap gap-4">
            {urgentRequests.map((request, index) => (
              <UrgentRequestItem key={index} request={request} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const UrgentRequestItem = ({ request }) => (
  <div className="flex items-center gap-2 bg-error-content/10 px-3 py-1 rounded-full text-white">
    <span className="font-bold">{request.bloodType}</span>
    <span className="text-sm">at {request.hospital}</span>
    <span className="badge badge-sm badge-error-content">{request.distance}</span>
  </div>
);

export default UrgentBanner;