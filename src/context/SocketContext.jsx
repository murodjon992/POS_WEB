import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, user, isAuthenticated }) => {
  const queryClient = useQueryClient();
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = () => {
    // Agar foydalanuvchi tizimga kirmagan bo'lsa, ulanmaymiz
    if (!isAuthenticated || !user) return;
    
    // Mavjud faol ulanish bo'lsa va u ochiq bo'lsa, qayta ulanish shart emas
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;

    if (socketRef.current) {
      socketRef.current.close();
    }

   // Agarda loyiha localda ishlayotgan bo'lsa (localhost/127.0.0.1), backend portini (masalan: 8000) ko'rsatamiz:
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Backend manzilini o'zingizning backend portingizga moslang (Masalan: 8000 port)
const backendHost = isLocal ? 'localhost:8000' : window.location.host;

const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const socketUrl = `${protocol}${backendHost}/ws/pos/`;

    console.log("🔗 Soketga ulanishga urinish:", socketUrl);
    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      console.log("🟢 Soket muvaffaqiyatli ulandi!");
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 Soketdan xabar keldi:", data);

        switch (data.action) {
          case "STOCK_UPDATE":
            queryClient.invalidateQueries(['inventory']);
            queryClient.invalidateQueries(['products']);
            if (user?.role !== 'superadmin') {
              toast.success("Ombor yangilandi! 📦");
            }
            break;

          case "SUBSCRIPTION_UPDATE":
            queryClient.invalidateQueries(['my-sub']);
            queryClient.invalidateQueries(['owner-dashboard']);
            queryClient.invalidateQueries(['admin-store-stats']);
            queryClient.invalidateQueries(['admin-subscriptions']);
            toast.info("Obuna holati yangilandi! 🚀");
            break;

          case "NEW_SALE":
            queryClient.invalidateQueries(['sales-history']);
            queryClient.invalidateQueries(['owner-dashboard']);
            queryClient.invalidateQueries(['admin-store-stats']);
            queryClient.invalidateQueries(['daily-summary']);
            if (user?.role !== 'superadmin') {
              toast.success("Yangi savdo! 💰");
            }
            break;
            
          case "DEBT_PAY":
            queryClient.invalidateQueries(['debtors']);
            queryClient.invalidateQueries(['owner-dashboard']);
            if (user?.role !== 'superadmin') {
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
      console.log(`🔴 Soket yopildi (Kod: ${e.code}). 3 soniyadan keyin qayta ulanadi...`);
      
      // Cheksiz taymerlar ko'payib ketmasligi uchun oldingisini tozalaymiz
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    socket.onerror = (err) => {
      console.error("⚠️ WebSocket xatoga uchradi:", err);
      // 🔥 TUZATISH: Bu yerda socket.close() chaqirmaymiz, chunki onclose o'zi avtomatik ishlaydi
    };

    socketRef.current = socket;
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    }

    return () => {
      if (socketRef.current) {
        // Unmount bo'lganda onclose hodisasini tozalaymiz, aks holda yana qayta ulanishga harakat qiladi
        socketRef.current.onclose = null; 
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

