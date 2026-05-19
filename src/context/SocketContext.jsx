import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, user, isAuthenticated }) => {
  const queryClient = useQueryClient();
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = () => {
    // Agar eski ulanish bo'lsa yoki hali login qilmagan bo'lsa, to'xtatamiz
    if (!isAuthenticated || !user) return;
    
    // Mavjud ulanishni tozalash
    if (socketRef.current) {
      socketRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    // Portni 8000 deb qat'iy belgiladik (Backend portingiz)
    const socketUrl = `${protocol}${window.location.hostname}:8000/ws/pos/`;

    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      // Ulanish muvaffaqiyatli bo'lsa, qayta ulanish taymerini o'chiramiz
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    console.log("📩 Soketdan xabar keldi:", data);

    // Endi data to'g'ridan-to'g'ri {action: "...", payload: {...}} ko'rinishida keladi
    switch (data.action) {
      case "STOCK_UPDATE":
        queryClient.invalidateQueries(['inventory']);
        queryClient.invalidateQueries(['products']);
        if(user?.role !== 'superadmin'){
        toast.success("Ombor yangilandi! 📦");
        }
        break;

      case "SUBSCRIPTION_UPDATE":
        queryClient.invalidateQueries(['my-sub']);
        queryClient.invalidateQueries(['owner-dashboard']);
        queryClient.invalidateQueries(['admin-subscriptions']);
        toast.info("Obuna holati yangilandi! 🚀");
        break;

      case "NEW_SALE":
        queryClient.invalidateQueries(['sales-history']);
        queryClient.invalidateQueries(['owner-dashboard']);
        queryClient.invalidateQueries(['daily-summary']);
        if(user?.role !== 'superadmin'){
          toast.success("Yangi savdo! 💰");
        }
        break;
        
        case "DEBT_PAY":
          queryClient.invalidateQueries(['debtors']);
          queryClient.invalidateQueries(['owner-dashboard']);
          if(user?.role !== 'superadmin'){
              toast.info(`Qarz to'landi.`);
          }
        break;

      default:
        console.warn("Noma'lum action:", data.action);
    }
  } catch (err) {
    console.error("Xabarni o'qishda xatolik:", err);
  }
};

    socket.onclose = (e) => {
      // Avtomatik qayta ulanish (3 soniyadan keyin)
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    socket.onerror = (err) => {
      console.error("WebSocket xatosi ⚠️");
      socket.close();
    };

    socketRef.current = socket;
  };

  useEffect(() => {
    // Login holati o'zgarganda ulanishni boshlash
    if (isAuthenticated && user) {
      connect();
    }

    // Component unmount bo'lganda tozalash
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);