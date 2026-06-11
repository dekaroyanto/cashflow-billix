// components/PinProtection.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";

export default function PinProtection({ children }) {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkPin = () => {
      const pinVerified = Cookies.get("pin_verified");
      const pinTime = Cookies.get("pin_time");

      if (pathname === "/pin") {
        setIsLoading(false);
        return;
      }

      if (!pinVerified || pinVerified !== "true") {
        router.push("/pin");
        return;
      }

      if (pinTime) {
        const currentTime = Date.now();
        const verifiedTime = parseInt(pinTime);
        const timeDiff = (currentTime - verifiedTime) / 1000;

        if (timeDiff > 300) {
          // Sesi expired
          Cookies.remove("pin_verified");
          Cookies.remove("pin_time");
          router.push("/pin");
          return;
        }
      }

      setIsVerified(true);
      setIsLoading(false);
    };

    checkPin();

    // Interval untuk mengecek sesi setiap detik
    const interval = setInterval(checkPin, 1000);

    return () => clearInterval(interval);
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memeriksa sesi...</p>
        </div>
      </div>
    );
  }

  if (pathname !== "/pin" && !isVerified) {
    return null;
  }

  return children;
}
