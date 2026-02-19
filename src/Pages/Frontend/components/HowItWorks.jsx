import React, { useState } from "react";
import { FaTint, FaGlobe, FaMedal, FaChevronRight } from "react-icons/fa";

const HowItWorks = () => {
  const [selectedStep, setSelectedStep] = useState(null);

  const steps = [
    {
      step: "01",
      title: "Register",
      description:
        "Sign up in under 2 minutes. Provide your blood type, location, and availability.",
      icon: FaTint,
      color: "bg-red-500",
      details:
        "To register, fill out your personal info, blood type, location, and donation availability. This ensures you can be matched with nearby requests quickly.",
    },
    {
      step: "02",
      title: "Connect",
      description:
        "Get matched with those in need based on proximity and blood type compatibility.",
      icon: FaGlobe,
      color: "bg-blue-500",
      details:
        "Our system instantly finds compatible donors near you and sends notifications when a match occurs, making it fast and reliable.",
    },
    {
      step: "03",
      title: "Save Lives",
      description:
        "Receive notifications for emergencies and schedule your donation appointments.",
      icon: FaMedal,
      color: "bg-green-500",
      details:
        "Once notified, you can schedule your donation, help patients in critical need, and track the impact of your contributions.",
    },
  ];

  return (
    <section id="how-it-works" className="py-40 bg-linear-to-b from-base-100 to-base-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold">How It Works</h2>
          <p className="text-gray-500 mt-2 text-lg">
            Simple process. Real impact.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative bg-base-100 rounded-3xl shadow-lg hover:shadow-2xl transition-transform duration-300 hover:-translate-y-3 overflow-hidden"
            >
              <div
                className={`absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl ${step.color} shadow-lg`}
              >
                <step.icon />
              </div>
              <div className="p-8 pt-16 text-center">
                <span className="text-6xl font-extrabold text-gray-200 opacity-10">
                  {step.step}
                </span>
                <h3 className="text-2xl font-bold mt-4">{step.title}</h3>
                <p className="text-gray-100 mt-2">{step.description}</p>

                <button
                  onClick={() => setSelectedStep(step)}
                  className="mt-6 inline-flex items-center text-primary font-semibold hover:gap-3 transition-all duration-300 cursor-pointer"
                >
                  Learn More <FaChevronRight className="ml-2" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedStep && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg relative p-8 rounded-3xl">
            <button
              className="btn btn-ghost btn-sm btn-circle absolute right-4 top-4"
              onClick={() => setSelectedStep(null)}
            >
              ✕
            </button>
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-6 ${selectedStep.color} shadow-lg`}
            >
              <selectedStep.icon />
            </div>
            <h3 className="text-3xl font-bold text-center mb-4">
              {selectedStep.title}
            </h3>
            <p className="text-gray-200 text-center">{selectedStep.details}</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default HowItWorks;
