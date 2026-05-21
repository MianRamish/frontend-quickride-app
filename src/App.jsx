import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import {
  GetStarted,
  UserLogin,
  CaptainLogin,
  UserHomeScreen,
  CaptainHomeScreen,
  UserProtectedWrapper,
  CaptainProtectedWrapper,
  UserSignup,
  CaptainSignup,
  RideHistory,
  UserEditProfile,
  CaptainEditProfile,
  Error,
  ChatScreen,
  VerifyEmail,
  ResetPassword,
  ForgotPassword,
  AdminLogin,
  AdminHome
} from "./screens/";
import { logger } from "./utils/logger";
import { SocketDataContext } from "./contexts/SocketContext";
import { useEffect, useContext } from "react";

function App() {
  return (
    <div className="app-frame">
      <div className="app-shell">
        <BrowserRouter>
          <LoggingWrapper />
          <Routes>
            <Route path="/" element={<GetStarted />} />
            <Route path="/home" element={<UserProtectedWrapper><UserHomeScreen /></UserProtectedWrapper>} />
            <Route path="/login" element={<UserLogin />} />
            <Route path="/signup" element={<UserSignup />} />
            <Route path="/user/edit-profile" element={<UserProtectedWrapper><UserEditProfile /></UserProtectedWrapper>} />
            <Route path="/user/rides" element={<UserProtectedWrapper><RideHistory /></UserProtectedWrapper>} />
            <Route path="/captain/home" element={<CaptainProtectedWrapper><CaptainHomeScreen /></CaptainProtectedWrapper>} />
            <Route path="/captain/login" element={<CaptainLogin />} />
            <Route path="/captain/signup" element={<CaptainSignup />} />
            <Route path="/captain/edit-profile" element={<CaptainProtectedWrapper><CaptainEditProfile /></CaptainProtectedWrapper>} />
            <Route path="/captain/rides" element={<CaptainProtectedWrapper><RideHistory /></CaptainProtectedWrapper>} />
            <Route path="/:userType/chat/:rideId" element={<ChatScreen />} />
            <Route path="/:userType/verify-email/" element={<VerifyEmail />} />
            <Route path="/:userType/forgot-password/" element={<ForgotPassword />} />
            <Route path="/:userType/reset-password/" element={<ResetPassword />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/home" element={<AdminHome />} />
            <Route path="*" element={<Error />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;

function LoggingWrapper() {
  const location = useLocation();
  const { socket } = useContext(SocketDataContext);

  useEffect(() => {
    if (socket) {
      logger(socket);
    }
  }, [location.pathname, location.search]);
  return null;
}