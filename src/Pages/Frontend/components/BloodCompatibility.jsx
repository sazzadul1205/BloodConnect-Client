import { FaTint, FaShieldAlt } from "react-icons/fa";

const BloodCompatibility = () => {
  const compatibilityData = [
    { type: "O-", donateTo: "All types", receiveFrom: "O-" },
    { type: "O+", donateTo: "O+, A+, B+, AB+", receiveFrom: "O+, O-" },
    { type: "A-", donateTo: "A-, A+, AB-, AB+", receiveFrom: "A-, O-" },
    { type: "A+", donateTo: "A+, AB+", receiveFrom: "A+, A-, O+, O-" },
  ];

  return (
    <section id="compatibility" className="py-40 bg-base-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <CompatibilityInfo />
          <CompatibilityChart data={compatibilityData} />
        </div>
      </div>
    </section>
  );
};

const CompatibilityInfo = () => (
  <div>
    <h2 className="text-4xl font-bold mb-6">
      Blood Type Compatibility
    </h2>

    <p className="text-lg opacity-80 mb-8">
      Understanding blood type compatibility is crucial for safe transfusions.
      Universal donors (O-) can give to anyone, while universal recipients (AB+)
      can receive from all types.
    </p>

    <div className="space-y-6">
      <InfoItem
        icon={FaTint}
        color="error"
        title="Universal Donor"
        description="Type O- can donate to anyone in emergencies"
      />
      <InfoItem
        icon={FaShieldAlt}
        color="primary"
        title="Universal Recipient"
        description="Type AB+ can receive from all blood types"
      />
    </div>
  </div>
);

// eslint-disable-next-line no-unused-vars
const InfoItem = ({ icon: Icon, color, title, description }) => {
  // Safe Tailwind mapping (prevents purge issues)
  const colorMap = {
    error: {
      text: "text-error",
      bg: "bg-error/10",
    },
    primary: {
      text: "text-primary",
      bg: "bg-primary/10",
    },
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className={`w-16 h-16 ${colorMap[color].bg} rounded-full flex items-center justify-center`}
      >
        <Icon className={`${colorMap[color].text} text-2xl`} />
      </div>

      <div>
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="opacity-70">{description}</p>
      </div>
    </div>
  );
};

const CompatibilityChart = ({ data }) => (
  <div className="card bg-base-100 shadow-xl">
    <div className="card-body">
      <h3 className="text-xl font-bold mb-4">
        Compatibility Chart
      </h3>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Blood Type</th>
              <th>Can Donate To</th>
              <th>Can Receive From</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td className="font-bold text-error">
                  {row.type}
                </td>
                <td>{row.donateTo}</td>
                <td>{row.receiveFrom}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default BloodCompatibility;
