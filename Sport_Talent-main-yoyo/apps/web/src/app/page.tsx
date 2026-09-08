"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PranaHome } from "@/components/prana-home/PranaHome";
import Login from "./login/page";

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const syncAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const isLoggedIn = localStorage.getItem("isLoggedIn");
        setIsAuthenticated(Boolean(token || isLoggedIn === "true"));
      } catch {
        setIsAuthenticated(false);
      }
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("prana_auth_change", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("prana_auth_change", syncAuth);
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0B100E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B7F34A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not authenticated, show the Login page first in front
  if (!isAuthenticated) {
    return <Login />;
  }

  // Once authenticated, show the PRANA Home experience
  return <PranaHome />;
}
