import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
<<<<<<< HEAD
=======
import VerifyEmail from "../components/VerifyEmail";
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
import Loading from "./Loading";

function UserProtectedWrapper({ children }) {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
<<<<<<< HEAD
  const { setUser } = useUser();

  const [loading, setLoading] = useState(true);
=======
  const { user, setUser } = useUser();

  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(null);
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/user/profile`, {
        headers: {
          token: token,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          const user = response.data.user;
          setUser(user);
          localStorage.setItem(
            "userData",
            JSON.stringify({ type: "user", data: user })
          );
<<<<<<< HEAD
=======
          setIsVerified(user.emailVerified);
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        navigate("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  if (loading) return <Loading />;

<<<<<<< HEAD
=======
  if (isVerified === false) {
    return <VerifyEmail user={user} role={"user"} />;
  }
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7

  return <>{children}</>;
}


export default UserProtectedWrapper;
