// Pages/Frontend/Home.jsx

// React
import React, { Suspense, lazy } from "react";

// Layout
import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";
import BackToTop from "./layout/BackToTop";
import CookieConsent from "./layout/CookieConsent";

// Components
import Loading from "./components/Loading";

// Lazy load sections for performance
const HeroSection = lazy(() => import("./components/HeroSection"));
const UrgentBanner = lazy(() => import("./components/UrgentBanner"));
const StatsSection = lazy(() => import("./components/StatsSection"));
const HowItWorks = lazy(() => import("./components/HowItWorks"));
const BloodCompatibility = lazy(() => import("./components/BloodCompatibility"));
const Testimonials = lazy(() => import("./components/Testimonials"));
const EmergencyCTA = lazy(() => import("./components/EmergencyCTA"));

const Home = () => {
  return (
    <div className="bg-linear-to-b from-base-100 to-base-200 min-h-screen scroll-smooth">
      <Navbar />

      <Suspense fallback={<Loading />}>
        <HeroSection />
        <UrgentBanner />
        <StatsSection />
        <HowItWorks />
        <BloodCompatibility />
        <Testimonials />
        <EmergencyCTA />
      </Suspense>

      <Footer />

      <BackToTop />
      <CookieConsent />
    </div>
  );
};

export default Home;
