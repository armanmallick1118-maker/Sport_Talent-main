"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PranaHome } from "@/components/prana-home/PranaHome";
import Login from "./login/page";

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const isLoggedIn = localStorage.getItem("isLoggedIn");

      if (!token && isLoggedIn !== "true") {
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    } catch {
      setIsAuthenticated(false);
    }
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
