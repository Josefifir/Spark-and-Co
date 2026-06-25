"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const CustomerAuthContext = createContext({ isLoggedIn: false, refresh: () => {} });

export function CustomerAuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/customer/me", { cache: "no-store" });
      setIsLoggedIn(res.ok);
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  // Check once on mount only
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <CustomerAuthContext.Provider value={{ isLoggedIn, refresh }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  return useContext(CustomerAuthContext);
}
