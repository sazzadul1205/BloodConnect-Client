// Pages/Frontend/components/Testimonials.jsx

import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import { FaHeartbeat } from "react-icons/fa";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
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

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Donor",
      text: "I've donated 8 times. Knowing I might save a life keeps me coming back.",
      image: "https://i.pravatar.cc/150?img=1",
      rating: 5,
    },
    {
      name: "Dr. Michael Chen",
      role: "Partner Hospital",
      text: "This platform has revolutionized our emergency blood supply system.",
      image: "https://i.pravatar.cc/150?img=2",
      rating: 5,
    },
    {
      name: "Robert Williams",
      role: "Recipient",
      text: "A donor saved my life during surgery. Now I'm a regular donor myself.",
      image: "https://i.pravatar.cc/150?img=3",
      rating: 5,
    },
    {
      name: "Emily Davis",
      role: "Donor",
      text: "Joining BloodConnect was the best decision. I can help people nearby anytime.",
      image: "https://i.pravatar.cc/150?img=4",
      rating: 5,
    },
    {
      name: "Dr. Raj Patel",
      role: "Partner Hospital",
      text: "The notification system is amazing. We never run out of blood in emergencies now.",
      image: "https://i.pravatar.cc/150?img=5",
      rating: 5,
    },
    {
      name: "James Thompson",
      role: "Recipient",
      text: "Thanks to a donor from this platform, I recovered quickly after surgery. Highly recommended!",
      image: "https://i.pravatar.cc/150?img=6",
      rating: 5,
    },
  ];

  return (
    <motion.section
      id="testimonials"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
      className="py-16 lg:py-24 bg-base-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div variants={fadeUp}>
          <SectionHeader
            title="Trusted by Thousands"
            subtitle="Real stories from our community"
          />
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={fadeUp}>
              <TestimonialCard testimonial={testimonial} />
            </motion.div>
          ))}
        </motion.div>

      </div>
    </motion.section>
  );
};

const SectionHeader = ({ title, subtitle }) => (
  <div className="text-center mb-10 lg:mb-14">
    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
      {title}
    </h2>
    <p className="opacity-70 mt-3 text-sm sm:text-base lg:text-lg">
      {subtitle}
    </p>
  </div>
);

const TestimonialCard = ({ testimonial }) => (
  <div className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
    <div className="card-body p-6">

      <div className="flex items-center gap-4 mb-4">
        <div className="avatar">
          <div className="w-12 sm:w-14 rounded-full">
            <img
              src={testimonial.image}
              alt={testimonial.name}
              loading="lazy"
            />
          </div>
        </div>

        <div>
          <h3 className="font-bold text-sm sm:text-base">
            {testimonial.name}
          </h3>
          <p className="text-xs sm:text-sm opacity-70">
            {testimonial.role}
          </p>
        </div>
      </div>

      <p className="opacity-80 text-sm sm:text-base leading-relaxed">
        “{testimonial.text}”
      </p>

      <RatingStars rating={testimonial.rating} />
    </div>
  </div>
);

const RatingStars = ({ rating }) => (
  <div className="flex text-error mt-4 gap-1">
    {[...Array(rating)].map((_, i) => (
      <FaHeartbeat key={i} className="text-xs sm:text-sm" />
    ))}
  </div>
);

export default Testimonials;