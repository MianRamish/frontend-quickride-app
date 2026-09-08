import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import Console from "../utils/console";

export const SocketDataContext = createContext();

const socket = io(`${import.meta.env.VITE_SERVER_URL}`, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 800,
  reconnectionDelayMax: 5000,
});

function SocketContext({ children }) {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      Console.log("Connected to server");
    };
    const handleDisconnect = () => {
      setIsConnected(false);
      Console.log("Disconnected from server");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  return (
    <SocketDataContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketDataContext.Provider>
  );
}

export default SocketContext;
