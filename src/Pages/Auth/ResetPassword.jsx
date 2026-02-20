// Pages/auth/ResetPassword.jsx

// React
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams, useNavigate, Link } from "react-router";

// Icons
import { FaLock, FaArrowLeft, FaHeartbeat } from "react-icons/fa";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Hooks
import useAuth from "../../hooks/useAuth";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [success, setSuccess] = useState(false);

  // Hooks Calls
  const navigate = useNavigate();
  const { resetPassword, loading } = useAuth();

  // Get token from URL
  const token = searchParams.get("token");

  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  // Submit handler
  const onSubmit = async (data) => {
    try {
      await resetPassword({
        token,
        password: data.password,
      });

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-md bg-base-100 shadow-2xl border border-error/20"
      >
        <div className="card-body">
          <div className="text-center mb-6">
            <FaHeartbeat className="text-4xl text-error mx-auto mb-2" />
            <h2 className="text-2xl font-bold">Reset Password</h2>
            <p className="text-sm opacity-70">
              Enter your new password
            </p>
          </div>

          {success ? (
            <div className="alert alert-success">
              Password reset successful. Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* New Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaLock className="text-error" />
                    New Password
                  </span>
                </label>
                <input
                  type="password"
                  className={`input input-bordered w-full ${errors.password ? "input-error" : ""
                    }`}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Minimum 6 characters",
                    },
                  })}
                />
                {errors.password && (
                  <span className="text-error text-sm mt-1">
                    {errors.password.message}
                  </span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-control">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className={`input input-bordered w-full ${errors.confirmPassword ? "input-error" : ""
                    }`}
                  {...register("confirmPassword", {
                    required: "Confirm your password",
                    validate: (value) =>
                      // eslint-disable-next-line react-hooks/incompatible-library
                      value === watch("password") || "Passwords do not match",
                  })}
                />
                {errors.confirmPassword && (
                  <span className="text-error text-sm mt-1">
                    {errors.confirmPassword.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-error w-full text-white"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <div className="text-center mt-4">
            <Link
              to="/login"
              className="link link-error flex items-center justify-center gap-2"
            >
              <FaArrowLeft /> Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;