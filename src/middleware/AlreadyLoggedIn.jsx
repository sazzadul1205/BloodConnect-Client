import { Navigate, Outlet } from "react-router";
import useAuth from "../hooks/useAuth";

const roleRoutes = {
  donor: "/donor/dashboard",
  hospital: "/hospital/dashboard",
  requester: "/requester/dashboard",
  blood_bank: "/blood_bank/dashboard",
  admin: "/admin/dashboard",
  super_admin: "/super_admin/dashboard",
};

const AlreadyLoggedIn = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-error"></span>
      </div>
    );
  }

  if (user) {
    return <Navigate to={roleRoutes[user.role] || "/"} replace />;
  }

  return <Outlet />;
};

export default AlreadyLoggedIn;