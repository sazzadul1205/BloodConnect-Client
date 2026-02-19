import React from "react";
import { FaTint, FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <>
      <footer className="footer flex justify-between p-10 bg-base-200 text-base-content">

        {/* Brand Section */}
        <aside>
          <div className="flex items-center gap-2 text-xl font-bold">
            <FaTint className="text-error text-2xl" />
            Blood Connect
          </div>
          <p className="max-w-xs mt-2">
            Connecting donors with patients. Saving lives through community
            support and real-time blood donation requests.
          </p>
        </aside>

        {/* Quick Links */}
        <nav>
          <h6 className="footer-title">Quick Links</h6>
          <a className="link link-hover">Home</a>
          <a className="link link-hover">Donate Blood</a>
          <a className="link link-hover">Request Blood</a>
          <a className="link link-hover">About Us</a>
          <a className="link link-hover">Contact</a>
        </nav>

        {/* Legal */}
        <nav>
          <h6 className="footer-title">Legal</h6>
          <a className="link link-hover">Terms of Service</a>
          <a className="link link-hover">Privacy Policy</a>
          <a className="link link-hover">Cookie Policy</a>
        </nav>

        {/* Social + Newsletter */}
        <nav>
          <h6 className="footer-title">Stay Connected</h6>

          <div className="flex gap-4 text-xl">
            <a className="hover:text-error transition">
              <FaFacebook />
            </a>
            <a className="hover:text-error transition">
              <FaTwitter />
            </a>
            <a className="hover:text-error transition">
              <FaInstagram />
            </a>
          </div>

          <div className="form-control mt-4 w-64">
            <label className="label">
              <span className="label-text">Subscribe to updates</span>
            </label>
            <div className="join">
              <input
                type="email"
                placeholder="email@example.com"
                className="input input-bordered join-item"
              />
              <button className="btn btn-error join-item">
                Subscribe
              </button>
            </div>
          </div>
        </nav>
      </footer>

      <footer className="footer sm:footer-horizontal footer-center bg-base-200 text-base-content p-4 border-t border-gray-300">
        <aside>
          <p>Copyright © {new Date().getFullYear()} - Made By Sazzadul Islam</p>
        </aside>
      </footer>
    </>
  );
};

export default Footer;
