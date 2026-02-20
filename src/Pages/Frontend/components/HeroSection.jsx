// Pages/Frontend/components/HeroSection.jsx


// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaTint, FaHeartbeat, FaChevronRight } from "react-icons/fa";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

const HeroSection = () => {
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden py-16 lg:py-24"
    >
      {/* Background Icons */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-4 sm:left-10 text-error text-[120px] sm:text-[180px] rotate-12">
          <FaTint />
        </div>
        <div className="absolute bottom-10 right-4 sm:right-10 text-error text-[100px] sm:text-[150px] -rotate-12">
          <FaTint />
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* LEFT */}
          <motion.div variants={containerVariants} className="space-y-6 text-center lg:text-left">

            <motion.div
              variants={fadeUp}
              className="inline-flex items-center justify-center lg:justify-start gap-2 bg-error/10 text-error px-4 py-2 rounded-full text-sm sm:text-base"
            >
              <FaHeartbeat className="animate-pulse" />
              <span className="font-semibold">
                Emergency Response Available 24/7
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight"
            >
              Donate Blood.
              <span className="text-error block">Save Lives.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-base sm:text-lg md:text-xl opacity-80 max-w-xl mx-auto lg:mx-0"
            >
              Join 5,000+ life-savers in our community. Find donors instantly or
              respond to emergency blood requests near you.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
            >
              <button className="btn btn-error btn-md sm:btn-lg gap-2 group">
                Become a Donor
                <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button className="btn btn-outline btn-primary btn-md sm:btn-lg">
                Request Blood
              </button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="grid grid-cols-3 gap-4 pt-6 max-w-md mx-auto lg:mx-0"
            >
              <QuickStat value="24/7" label="Emergency Support" />
              <QuickStat value="<30 min" label="Response Time" />
              <QuickStat value="100%" label="Free Service" />
            </motion.div>

          </motion.div>

          {/* RIGHT */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {bloodTypes.map((type) => (
              <motion.div key={type} variants={fadeUp}>
                <BloodTypeCard type={type} />
              </motion.div>
            ))}
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
};

const QuickStat = ({ value, label }) => (
  <div className="text-center lg:text-left">
    <div className="text-lg sm:text-xl font-bold text-error">{value}</div>
    <div className="text-xs sm:text-sm opacity-70">{label}</div>
  </div>
);

const BloodTypeCard = ({ type }) => (
  <div className="card bg-base-100/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer">
    <div className="card-body items-center p-4">
      <div className="text-2xl sm:text-3xl font-bold text-error">{type}</div>
      <div className="text-xs opacity-70">Blood Type</div>
    </div>
  </div>
);

export default HeroSection;