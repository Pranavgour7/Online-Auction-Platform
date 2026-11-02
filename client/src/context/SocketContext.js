import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    // Create socket instance using centralized SOCKET_URL
    const socketInstance = io(SOCKET_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });
    
    socketInstance.on('connect', () => {
      setConnected(true);
    });
    
    socketInstance.on('disconnect', () => {
      setConnected(false);
    });
    
    socketInstance.on('connect_error', () => {
      // Fallback silently without spamming console
    });
    
    setSocket(socketInstance);
    
    return () => {
      socketInstance.disconnect();
    };
  }, []);
  
  // Join an auction room
  const joinAuction = (auctionId) => {
    if (socket && connected && auctionId) {
      socket.emit('joinAuction', auctionId);
    }
  };

  // Leave an auction room
  const leaveAuction = (auctionId) => {
    if (socket && connected && auctionId) {
      socket.emit('leaveAuction', auctionId);
    }
  };

  // Place a new bid
  const placeBid = (bid) => {
    if (socket && connected && bid) {
      socket.emit('newBid', bid);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        joinAuction,
        leaveAuction,
        placeBid
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

export default SocketContext;
