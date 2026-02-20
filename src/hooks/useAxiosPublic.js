// hooks/useAxiosPublic.js
import { useState, useCallback } from "react";
import axios from "axios";

const axiosPublic = axios.create({
  baseURL: "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

const useAxiosPublic = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(
    async ({ method = "get", url = "", body = null, config = {} }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosPublic({
          method,
          url,
          data: body,
          ...config,
        });
        setData(response.data);
        return response.data; // useful for manual handling
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { data, loading, error, request, axiosInstance: axiosPublic };
};

export default useAxiosPublic;
