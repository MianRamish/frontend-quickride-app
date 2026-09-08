<<<<<<< HEAD
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
=======
import { createContext, useEffect } from "react";
import { io } from "socket.io-client";

export const SocketDataContext = createContext();

const socket = io(`${import.meta.env.VITE_SERVER_URL}`);

import Console from "../utils/console";

function SocketContext({ children }) {
  useEffect(() => {
    socket.on("connect", () => {
      Console.log("Connected to server");
    });

    socket.on("disconnect", () => {
      Console.log("Disconnected from server");
    });
  }, []);

  return (
    <SocketDataContext.Provider value={{ socket }}>
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
      {children}
    </SocketDataContext.Provider>
  );
}

export default SocketContext;
