
import { FaHeartbeat } from "react-icons/fa";

const BloodLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200">

      {/* IV Bag */}
      <div className="relative flex flex-col items-center mb-8">

        <div className="w-24 h-32 bg-base-100 border border-base-300 rounded-2xl shadow-xl flex flex-col items-center justify-between p-3">

          {/* Medical Icon */}
          <FaHeartbeat className="text-red-600 text-xl animate-pulse" />

          {/* Blood Fill */}
          <div className="relative w-full h-14 bg-base-300 rounded-xl overflow-hidden">
            <div className="absolute bottom-0 w-full bg-red-600 animate-bloodFlow rounded-xl"></div>
          </div>
        </div>

        {/* Tube */}
        <div className="w-1 h-10 bg-red-600 rounded-full mt-1 animate-pulse"></div>
      </div>

      {/* Loading Text */}
      <p className="text-red-600 font-semibold tracking-widest animate-pulse">
        Connecting Donors...
      </p>

      {/* Custom Animations */}
      <style>
        {`
          @keyframes bloodFlow {
            0% { height: 0%; }
            50% { height: 100%; }
            100% { height: 0%; }
          }

          .animate-bloodFlow {
            animation: bloodFlow 2.5s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
};

export default BloodLoader;