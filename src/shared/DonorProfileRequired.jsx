// Shared/DonorProfileRequired.jsx

// React
import React from "react";
import { Link } from "react-router";

// Icons
import { FaHeart, FaTint } from "react-icons/fa";

// 
import { motion } from "framer-motion";

const MotionDiv = motion.div;

const DonorProfileRequired = ({
  title = "Create Donor Profile First",
  description = "You need a donor profile to access this page.",
}) => {
  return (
    <div className="min-h-[60vh] bg-base-200 flex items-center justify-center p-6">
      <MotionDiv
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card bg-base-100 shadow-xl w-full max-w-lg border border-error/20"
      >
        <div className="card-body items-center text-center space-y-4">
          <div className="bg-error/10 text-error rounded-full w-20 h-20 flex items-center justify-center">
            <FaTint size={34} />
          </div>
          <h2 className="card-title text-2xl text-error">{title}</h2>
          <p className="text-base-content/70">{description}</p>
          <Link to="/donor/profile" className="btn btn-error text-white gap-2">
            <FaHeart />
            Create Donor Profile
          </Link>
        </div>
      </MotionDiv>
    </div>
  );
};

export default DonorProfileRequired;
