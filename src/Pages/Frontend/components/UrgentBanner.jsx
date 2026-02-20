// Pages/Frontend/components/UrgentBanner.jsx

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaAmbulance } from "react-icons/fa";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const UrgentBanner = () => {
  const urgentRequests = [
    {
      bloodType: "O-",
      hospital: "City General Hospital",
      urgency: "Critical",
      distance: "2.5 km",
    },
    {
      bloodType: "B+",
      hospital: "Memorial Medical Center",
      urgency: "High",
      distance: "5 km",
    },
    {
      bloodType: "AB+",
      hospital: "Children's Hospital",
      urgency: "Urgent",
      distance: "3.2 km",
    },
  ];

  return (
    <motion.section
      id="urgent-requests"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="bg-error text-error-content py-4 sm:py-6"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">

          {/* Left Label */}
          <motion.div
            variants={fadeUp}
            className="flex items-center gap-3"
          >
            <FaAmbulance className="text-xl sm:text-2xl animate-pulse" />
            <span className="font-bold text-sm sm:text-base tracking-wide">
              URGENT NEEDS:
            </span>
          </motion.div>

          {/* Requests */}
          <motion.div
            variants={containerVariants}
            className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto"
          >
            {urgentRequests.map((request, index) => (
              <motion.div key={index} variants={fadeUp}>
                <UrgentRequestItem request={request} />
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </motion.section>
  );
};

const UrgentRequestItem = ({ request }) => (
  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-error-content/10 px-3 py-2 rounded-full text-white text-xs sm:text-sm backdrop-blur-sm">

    <span className="font-bold">{request.bloodType}</span>

    <span className="opacity-90">
      at {request.hospital}
    </span>

    <span className="badge badge-sm badge-error-content shrink-0">
      {request.distance}
    </span>
  </div>
);

export default UrgentBanner;