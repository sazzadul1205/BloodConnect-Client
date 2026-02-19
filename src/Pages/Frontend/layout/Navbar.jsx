import React, { useEffect, useState } from "react";
import { FaTint, FaBars, FaTimes } from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState("hero");

  const navLinks = [
    { name: "Welcome", href: "hero" },
    { name: "Urgent Needs", href: "urgent-requests" },
    { name: "Statistics", href: "stats" },
    { name: "How It Works", href: "how-it-works" },
    { name: "Compatibility", href: "compatibility" },
    { name: "Testimonials", href: "testimonials" },
    { name: "Emergency", href: "emergency-cta" },
  ];

  // Smooth scroll
  const handleScroll = (e, id) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  // Intersection Observer for active tracking
  useEffect(() => {
    // Use setTimeout to ensure sections are rendered
    const timeoutId = setTimeout(() => {
      const sections = document.querySelectorAll("section");

      if (sections.length === 0) {
        console.log("No sections found yet, retrying...");
        return;
      }

      console.log("Found sections:", sections.length); // Debug log

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              console.log("Active section:", entry.target.id); // Debug log
              setActive(entry.target.id);
            }
          });
        },
        {
          threshold: 0.3, // Reduced threshold for better detection
          rootMargin: "-100px 0px -100px 0px", // Adjust the detection area
        }
      );

      sections.forEach((section) => {
        if (section.id) {
          observer.observe(section);
        }
      });

      return () => {
        sections.forEach((section) => {
          if (section.id) {
            observer.unobserve(section);
          }
        });
      };
    }, 500); // Wait 500ms for lazy-loaded sections to appear

    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array means this runs once after mount

  return (
    <nav className="bg-base-100 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <FaTint className="text-error text-2xl" />
            <span className="font-bold text-xl">BloodConnect</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={`#${link.href}`}
                onClick={(e) => handleScroll(e, link.href)}
                className={`cursor-pointer transition-all duration-300 ${active === link.href
                    ? "text-error font-semibold border-b-2 border-error pb-1"
                    : "hover:text-error font-semibold"
                  }`}
              >
                {link.name}
              </a>
            ))}
            <button className="btn btn-error btn-sm">Emergency</button>
            <ThemeToggle />
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden btn btn-ghost btn-circle"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden py-4 border-t">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={`#${link.href}`}
                onClick={(e) => handleScroll(e, link.href)}
                className={`block py-2 transition-all ${active === link.href
                    ? "text-error font-semibold"
                    : "hover:text-error"
                  }`}
              >
                {link.name}
              </a>
            ))}
            <button className="btn btn-error btn-sm w-full mt-4">
              Emergency
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;