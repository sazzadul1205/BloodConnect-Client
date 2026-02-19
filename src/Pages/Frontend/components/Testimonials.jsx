import React from "react";
import { FaHeartbeat } from "react-icons/fa";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Donor",
      text: "I've donated 8 times. Knowing I might save a life keeps me coming back.",
      image: "https://i.pravatar.cc/150?img=1",
      rating: 5
    },
    {
      name: "Dr. Michael Chen",
      role: "Partner Hospital",
      text: "This platform has revolutionized our emergency blood supply system.",
      image: "https://i.pravatar.cc/150?img=2",
      rating: 5
    },
    {
      name: "Robert Williams",
      role: "Recipient",
      text: "A donor saved my life during surgery. Now I'm a regular donor myself.",
      image: "https://i.pravatar.cc/150?img=3",
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="py-40 bg-base-200">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader
          title="Trusted by Thousands"
          subtitle="Real stories from our community"
        />

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

const SectionHeader = ({ title, subtitle }) => (
  <div className="text-center mb-12">
    <h2 className="text-4xl font-bold">{title}</h2>
    <p className="opacity-70 mt-2">{subtitle}</p>
  </div>
);

const TestimonialCard = ({ testimonial }) => (
  <div className="card bg-base-100 shadow-xl">
    <div className="card-body">
      <div className="flex items-center gap-4 mb-4">
        <div className="avatar">
          <div className="w-12 rounded-full">
            <img src={testimonial.image} alt={testimonial.name} />
          </div>
        </div>
        <div>
          <h3 className="font-bold">{testimonial.name}</h3>
          <p className="text-sm opacity-70">{testimonial.role}</p>
        </div>
      </div>
      <p className="opacity-80">"{testimonial.text}"</p>
      <RatingStars rating={testimonial.rating} />
    </div>
  </div>
);

const RatingStars = ({ rating }) => (
  <div className="flex text-error mt-4">
    {[...Array(rating)].map((_, i) => (
      <FaHeartbeat key={i} className="text-sm" />
    ))}
  </div>
);

export default Testimonials;