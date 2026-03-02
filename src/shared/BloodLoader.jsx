import { FaHeartbeat, FaTint } from "react-icons/fa";

const BloodLoader = ({ fullscreen = true }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${fullscreen ? "my-30 md:my-0 md:min-h-screen bg-base-200 p-4" : "py-10 px-4"
        }`}
    >
      {/* Responsive IV Bag */}
      <div className="relative flex flex-col items-center mb-4 sm:mb-6 md:mb-8">
        <div className="w-20 h-28 sm:w-24 sm:h-32 md:w-28 md:h-36 lg:w-32 lg:h-40 bg-base-100 border border-base-300 rounded-2xl shadow-xl flex flex-col items-center justify-between p-2 sm:p-3 md:p-4">

          {/* Medical Icon - Responsive sizing */}
          <FaHeartbeat className="text-red-600 text-lg sm:text-xl md:text-2xl lg:text-3xl animate-pulse" />

          {/* Blood Fill Container - Responsive */}
          <div className="relative w-full h-10 sm:h-14 md:h-16 lg:h-20 bg-base-300 rounded-xl overflow-hidden">
            <div className="absolute bottom-0 w-full bg-red-600 animate-bloodFlow rounded-xl"></div>
          </div>
        </div>

        {/* Tube - Responsive */}
        <div className="w-0.5 sm:w-1 h-8 sm:h-10 md:h-12 bg-red-600 rounded-full mt-1 animate-pulse"></div>

        {/* Dripping Blood Effect (Optional) */}
        <div className="relative -mt-1">
          <FaTint className="text-red-600 text-xs sm:text-sm animate-bounce opacity-75" />
        </div>
      </div>

      {/* Loading Text - Responsive */}
      <p className="text-red-600 font-semibold tracking-widest text-xs sm:text-sm md:text-base lg:text-lg animate-pulse text-center px-4">
        Connecting Donors...
      </p>

      {/* Animation Styles */}
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

          /* Optional: Add pulsing glow effect for larger screens */
          @media (min-width: 768px) {
            .animate-bloodFlow {
              box-shadow: 0 0 10px rgba(220, 38, 38, 0.5);
            }
          }
        `}
      </style>
    </div>
  );
};

export default BloodLoader;