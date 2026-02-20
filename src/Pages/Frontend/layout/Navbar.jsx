// Pages/Frontend/layout/Navbar.jsx

// React
import React, { useEffect, useState } from "react";

// Icons
import { FaTint, FaBars, FaTimes, FaChevronDown } from "react-icons/fa";

// Components
import ThemeToggle from "./ThemeToggle";
import { Link } from "react-router";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState("hero");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navLinks = [
    { name: "Welcome", href: "hero" },
    { name: "Urgent Needs", href: "urgent-requests" },
    { name: "Statistics", href: "stats" },
    { name: "How It Works", href: "how-it-works" },
    { name: "Compatibility", href: "compatibility" },
    { name: "Testimonials", href: "testimonials" },
  ];

  // Smooth scroll
  const handleScroll = (e, id) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
      setDropdownOpen(false);
    }
  };

  // Intersection Observer
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const sections = document.querySelectorAll("section");
      if (!sections.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(entry.target.id);
          });
        },
        { threshold: 0.3, rootMargin: "-100px 0px -100px 0px" }
      );

      sections.forEach((section) => section.id && observer.observe(section));

      return () => {
        sections.forEach((section) => section.id && observer.unobserve(section));
      };
    }, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  // Split links for tablet
  const primaryLinks = navLinks.slice(0, 3); // show 1 2 3 as numbered buttons
  const secondaryLinks = navLinks.slice(3); // rest go into dropdown

  return (
    <nav className="bg-base-100 shadow sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <FaTint className="text-error text-2xl" />
            <span className="font-bold text-xl">BloodConnect</span>
          </div>

          {/* Desktop Nav (lg+) */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={`#${link.href}`}
                onClick={(e) => handleScroll(e, link.href)}
                className={`relative px-2 py-1 transition-all duration-300 font-semibold ${active === link.href
                  ? "text-error after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-error"
                  : "hover:text-error"
                  }`}
              >
                {link.name}
              </a>
            ))}
            <ThemeToggle />
            <Link to="/login" className="btn btn-error btn-sm">Login</Link>
          </div>

          {/* Tablet Nav (md only, hidden on lg) */}
          <div className="hidden md:flex lg:hidden items-center gap-2">
            {primaryLinks.map((link) => (
              <button
                key={link.name}
                onClick={(e) => handleScroll(e, link.href)}
                className={`relative px-2 py-1 font-semibold transition-all duration-300 ${active === link.href
                  ? "text-error after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-error"
                  : "text-base-content hover:text-error"
                  }`}
              >
                {link.name}
              </button>
            ))}

            {/* Dropdown for remaining links */}
            <div className="relative">
              <button
                className="btn btn-sm flex items-center gap-1"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                More <FaChevronDown />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-base-100 shadow-lg rounded-lg py-2 z-50">
                  {secondaryLinks.map((link) => (
                    <a
                      key={link.name}
                      href={`#${link.href}`}
                      onClick={(e) => handleScroll(e, link.href)}
                      className={`block px-4 py-2 font-semibold hover:bg-base-200 ${active === link.href ? "text-error" : "text-base-content"
                        }`}
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <ThemeToggle />
            <Link to="/login" className="btn btn-error btn-sm">Login</Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden btn btn-ghost btn-circle"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-max-height duration-300 ease-in-out ${isOpen ? "max-h-screen py-4 border-t border-gray-200" : "max-h-0"
            }`}
        >
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={`#${link.href}`}
              onClick={(e) => handleScroll(e, link.href)}
              className={`block py-2 px-2 transition-colors font-semibold ${active === link.href ? "text-error" : "hover:text-error"
                }`}
            >
              {link.name}
            </a>
          ))}
          <Link to="/login" className="btn btn-error btn-sm w-full mt-4">Login</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;