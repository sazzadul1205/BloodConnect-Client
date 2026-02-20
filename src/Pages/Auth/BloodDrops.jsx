// Pages/auth/BloodDrops.jsx

// React
import { useState } from "react";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import { FaTint } from "react-icons/fa";

const BloodDrops = () => {
  const [drops] = useState(() =>
    [...Array(12)].map(() => ({
      x: Math.random() * 100,           // horizontal start
      yOffset: Math.random() * 50 - 25, // slight horizontal wobble
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 4,
      size: 5 + Math.random() * 5        // font size
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {drops.map((drop, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: -50 }}
          animate={{
            opacity: [0.2, 0.6, 0.2],
            y: ["-10%", "110%"],
            x: [`${drop.x}px`, `${drop.x + drop.yOffset}px`]
          }}
          transition={{
            duration: drop.duration,
            repeat: Infinity,
            delay: drop.delay,
          }}
          className="absolute text-red-600" // brighter red
          style={{
            fontSize: `${drop.size}rem`,
            left: `${drop.x}%`,
          }}
        >
          <FaTint />
        </motion.div>
      ))}
    </div>
  );
};

export default BloodDrops;