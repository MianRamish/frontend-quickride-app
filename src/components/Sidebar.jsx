import { useEffect, useState } from "react";

import { ChevronRight, CircleUserRound, History, KeyRound, Menu, X } from "lucide-react";
import Button from "./Button";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Console from "../utils/console";

function Sidebar() {
  const token = localStorage.getItem("token");
  const [showSidebar, setShowSidebar] = useState(false);
  const [newUser, setNewUser] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    setNewUser(userData);
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (showSidebar) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalOverflow || "";
    }
    return () => {
      document.body.style.overflow = originalOverflow || "";
    };
  }, [showSidebar]);

  const closeSidebar = () => setShowSidebar(false);

  const logout = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_SERVER_URL}/${newUser.type}/logout`, {
        headers: { token },
      });

      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("messages");
      localStorage.removeItem("rideDetails");
      localStorage.removeItem("panelDetails");
      localStorage.removeItem("showPanel");
      localStorage.removeItem("showBtn");
      closeSidebar();
      navigate("/");
    } catch (error) {
      Console.log("Error getting logged out", error);
    }
  };

  const initials = `${newUser?.data?.fullname?.firstname?.[0] || ""}${newUser?.data?.fullname?.lastname?.[0] || ""}` || "U";

  return (
    <>
      <button
        type="button"
        className="absolute right-4 top-4 z-[65] rounded-2xl border border-white/30 bg-white/90 p-2 text-slate-900 shadow-lg backdrop-blur"
        onClick={() => setShowSidebar(true)}
        aria-label="Open profile menu"
      >
        <Menu />
      </button>

      {showSidebar && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[69] bg-slate-950/30 backdrop-blur-[2px]"
            onClick={closeSidebar}
            aria-label="Close profile panel"
          />

          <aside className="fixed inset-0 z-[70] flex flex-col bg-white text-slate-950">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 pb-4 pt-4">
              <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
              <button
                type="button"
                onClick={closeSidebar}
                className="rounded-full p-2 text-slate-700 transition hover:bg-slate-100"
                aria-label="Close profile panel"
              >
                <X />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-32 pt-6">
              <div className="mb-8 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-400 text-5xl text-white shadow-sm">
                  {initials}
                </div>
                <h2 className="mt-4 text-[34px] font-black leading-none tracking-tight">
                  {newUser?.data?.fullname?.firstname} {newUser?.data?.fullname?.lastname}
                </h2>
                <p className="mt-2 break-all text-sm font-medium text-slate-400">{newUser?.data?.email}</p>
              </div>

              <div className="space-y-2">
                <Link
                  to={`/${newUser?.type}/edit-profile`}
                  onClick={closeSidebar}
                  className="flex items-center justify-between rounded-2xl px-3 py-4 transition hover:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <CircleUserRound className="h-5 w-5" />
                    <span className="text-base font-medium">Edit Profile</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-500" />
                </Link>

                <Link
                  to={`/${newUser?.type}/rides`}
                  onClick={closeSidebar}
                  className="flex items-center justify-between rounded-2xl px-3 py-4 transition hover:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <History className="h-5 w-5" />
                    <span className="text-base font-medium">Ride History</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-500" />
                </Link>

                <Link
                  to={`/${newUser?.type}/reset-password?token=${token}`}
                  onClick={closeSidebar}
                  className="flex items-center justify-between rounded-2xl px-3 py-4 transition hover:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <KeyRound className="h-5 w-5" />
                    <span className="text-base font-medium">Change Password</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-500" />
                </Link>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-100 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-4">
              <Button title={"Logout"} classes={"bg-red-600"} fun={logout} />
            </div>
          </aside>
        </>
      )}
    </>
  );
}

export default Sidebar;
