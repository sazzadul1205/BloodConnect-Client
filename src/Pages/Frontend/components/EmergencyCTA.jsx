import React from "react";
import { FaAmbulance, FaPhone } from "react-icons/fa";

const EmergencyCTA = () => {
  return (
    <section id="emergency-cta" className="py-20 bg-linear-to-r from-error to-error/80 text-error-content">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <EmergencyIcon />
        <h2 className="text-4xl font-bold mb-4">Need Blood Urgently?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Our emergency response team is available 24/7. Get connected with donors in your area within minutes.
        </p>
        <CTAButtons />
      </div>
    </section>
  );
};

const EmergencyIcon = () => (
  <FaAmbulance className="text-6xl mx-auto mb-6 animate-bounce" />
);

const CTAButtons = () => (
  <div className="flex flex-wrap gap-4 justify-center ">
    <button className="btn btn-outline btn-lg border-error-content text-error-content hover:bg-error-content hover:text-error">
      <FaPhone className="mr-2" />
      Emergency Hotline
    </button>
    <button className="btn btn-lg bg-error-content text-error border-error-content hover:bg-transparent hover:text-error-content">
      Find Donors Now
    </button>
  </div>
);

export default EmergencyCTA;