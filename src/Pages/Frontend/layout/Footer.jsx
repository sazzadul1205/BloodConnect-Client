// Pages/Frontend/layout/Footer.jsx

import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import { FaTint, FaFacebook, FaTwitter, FaInstagram, FaHeart } from "react-icons/fa";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const Footer = () => {
  return (
    <>
      <motion.footer
        className="bg-base-200 text-base-content px-4 sm:px-6 lg:px-8 py-10 lg:py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand Section */}
          <motion.aside variants={fadeUp}>
            <div className="flex items-center gap-2 text-xl font-bold">
              <FaTint className="text-error text-2xl" /> Blood Connect
            </div>
            <p className="mt-2 opacity-80 text-sm sm:text-base max-w-xs">
              Connecting donors with patients. Saving lives through community support and real-time blood donation requests.
            </p>
            <div className="mt-4 text-xs sm:text-sm opacity-70">
              <p>Version 1.0.0</p>
              <p className="flex items-center gap-1 mt-1">
                Developed with <FaHeart className="text-error text-xs" /> by Sazzadul Islam
              </p>
            </div>
          </motion.aside>

          {/* Quick Links */}
          <motion.nav variants={fadeUp}>
            <h6 className="footer-title">Quick Links</h6>
            <a className="link link-hover">Home</a>
            <a className="link link-hover">Donate Blood</a>
            <a className="link link-hover">Request Blood</a>
            <a className="link link-hover">About Us</a>
            <a className="link link-hover">Contact</a>
          </motion.nav>

          {/* Legal */}
          <motion.nav variants={fadeUp}>
            <h6 className="footer-title">Legal</h6>
            <a className="link link-hover">Terms of Service</a>
            <a className="link link-hover">Privacy Policy</a>
            <a className="link link-hover">Cookie Policy</a>
          </motion.nav>

          {/* Social + Newsletter */}
          <motion.nav variants={fadeUp}>
            <h6 className="footer-title">Stay Connected</h6>

            <div className="flex gap-4 text-xl mt-2">
              <a className="hover:text-error transition"><FaFacebook /></a>
              <a className="hover:text-error transition"><FaTwitter /></a>
              <a className="hover:text-error transition"><FaInstagram /></a>
            </div>

            <div className="form-control mt-4 w-full sm:w-64">
              <label className="label">
                <span className="label-text">Subscribe to updates</span>
              </label>
              <div className="join w-full">
                <input
                  type="email"
                  placeholder="email@example.com"
                  className="input input-bordered join-item flex-1"
                />
                <button className="btn btn-error join-item">Subscribe</button>
              </div>
            </div>
          </motion.nav>

        </div>
      </motion.footer>

      <motion.footer
        className="bg-base-200 text-base-content px-4 sm:px-6 lg:px-8 py-4 border-t border-gray-300 flex flex-col sm:flex-row justify-between items-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeUp}
      >
        <p className="text-sm">Copyright © {new Date().getFullYear()} - Blood Connect v1.0.0</p>
        <p className="text-xs sm:text-sm mt-2 sm:mt-0">
          Developed with React + Node.js by Sazzadul Islam
        </p>
      </motion.footer>
    </>
  );
};

export default Footer;