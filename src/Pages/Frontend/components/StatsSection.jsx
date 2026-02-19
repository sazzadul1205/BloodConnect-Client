import React from "react";
import { FaUserFriends, FaHeartbeat, FaHospital, FaClock } from "react-icons/fa";

const StatsSection = () => {
  const stats = [
    {
      icon: FaUserFriends,
      value: "5,000+",
      label: "Registered Donors",
      trend: "↑ 28% this month",
      gradient: true
    },
    {
      icon: FaHeartbeat,
      value: "2,300+",
      label: "Lives Saved",
      trend: "+147 this week",
      color: "error"
    },
    {
      icon: FaHospital,
      value: "120+",
      label: "Partner Hospitals",
      trend: "Across 25 cities"
    },
    {
      icon: FaClock,
      value: "24/7",
      label: "Active Support",
      trend: "Always here for you"
    }
  ];

  return (
    <section id="stats" className="py-40 relative">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader
          title="Our Impact in Numbers"
          subtitle="Making a difference together"
        />

        <div className="grid md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} index={index} />
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

const StatCard = ({ stat }) => {
  if (stat.gradient) {
    return (
      <div className="card bg-linear-to-br from-error to-error/80 text-error-content shadow-xl">
        <div className="card-body items-center">
          <stat.icon className="text-5xl mb-4" />
          <h3 className="text-4xl font-bold">{stat.value}</h3>
          <p>{stat.label}</p>
          <p className="text-sm opacity-75 mt-2">{stat.trend}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition">
      <div className="card-body items-center">
        <stat.icon className={`text-${stat.color || 'error'} text-5xl mb-4`} />
        <h3 className="text-4xl font-bold">{stat.value}</h3>
        <p className="opacity-70">{stat.label}</p>
        <p className={`text-sm ${stat.trend?.includes('+') ? 'text-success' : 'opacity-70'} mt-2`}>
          {stat.trend}
        </p>
      </div>
    </div>
  );
};

export default StatsSection;