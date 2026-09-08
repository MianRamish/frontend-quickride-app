import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCaptain } from "../contexts/CaptainContext";
<<<<<<< HEAD
=======
import VerifyEmail from "../components/VerifyEmail";
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
import Loading from "./Loading";

function CaptainProtectedWrapper({ children }) {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
<<<<<<< HEAD
  const { setCaptain } = useCaptain();

  const [loading, setLoading] = useState(true);
=======
  const { captain, setCaptain } = useCaptain();

  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(null);
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7

  useEffect(() => {
    if (!token) {
      navigate("/captain/login");
      return;
    }

    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/captain/profile`, {
        headers: {
          token: token,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          const captainData = response.data.captain;
          setCaptain(captainData);
          localStorage.setItem(
            "userData",
            JSON.stringify({ type: "captain", data: captainData })
          );
<<<<<<< HEAD
=======
          setIsVerified(captainData.emailVerified);
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
        }
      })
      .catch((err) => {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        navigate("/captain/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  if (loading) return <Loading />;

<<<<<<< HEAD
=======
  if (isVerified === false) {
    return <VerifyEmail user={captain} role={"captain"} />;
  }
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7

  return <>{children}</>;
}

export default CaptainProtectedWrapper;
