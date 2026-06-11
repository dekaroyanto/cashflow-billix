"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  PlusCircle,
  MinusCircle,
  Building2,
  History,
  BarChart3,
  User,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [currentTime, setCurrentTime] = useState("");
  const [showFabMenu, setShowFabMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const jakartaTime = now.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
      });
      setCurrentTime(jakartaTime);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setShowFabMenu(false);
  }, [pathname]);

  const menuItems = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/sumberdana", label: "Sumber Dana", icon: Building2 },
    { href: "/riwayat", label: "Riwayat", icon: History },
    { href: "/grafik", label: "Grafik", icon: BarChart3 },
  ];

  const isActive = (path) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  const handleQuickAction = (type) => {
    setShowFabMenu(false);
    router.push(type === "pemasukan" ? "/pemasukan" : "/pengeluaran");
  };

  return (
    <>
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded-xl shadow-lg">
                <div className="bg-white/20 rounded-lg p-1">
                  <span className="text-white text-xs font-bold">CF</span>
                </div>
              </div>
              <div>
                <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  CashFlow
                </h1>
                <p className="text-[10px] md:text-xs text-gray-500">Billix</p>
              </div>
            </Link>

            <div className="flex items-center gap-3 md:gap-4">
              {/* Desktop Menu - muncul di desktop */}
              <div className="hidden md:flex items-center gap-1">
                {menuItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        active
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="text-right">
                <p className="text-[10px] text-gray-400">Waktu</p>
                <p className="text-xs md:text-sm font-semibold text-gray-700">
                  {currentTime}
                </p>
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                DA
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-16"></div>

      {/* FAB - hanya di mobile */}
      <div className="fixed bottom-20 right-4 z-50 md:hidden">
        <AnimatePresence>
          {showFabMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-16 right-0 mb-2 space-y-2"
            >
              <button
                onClick={() => handleQuickAction("pemasukan")}
                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium whitespace-nowrap"
              >
                <PlusCircle className="h-4 w-4" />
                Pemasukan
              </button>
              <button
                onClick={() => handleQuickAction("pengeluaran")}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium whitespace-nowrap"
              >
                <MinusCircle className="h-4 w-4" />
                Pengeluaran
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFabMenu(!showFabMenu)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: showFabMenu ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {showFabMenu ? (
              <X className="h-6 w-6" />
            ) : (
              <PlusCircle className="h-6 w-6" />
            )}
          </motion.div>
        </motion.button>
      </div>

      {/* Bottom Navigation - hanya di mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-lg md:hidden">
        <div className="container mx-auto px-2">
          <div className="flex justify-around items-center py-2">
            {menuItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all relative"
                >
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                  <div
                    className={`p-2 rounded-full transition-all ${
                      active ? "text-blue-600 bg-blue-50" : "text-gray-500"
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 ${active ? "scale-110" : ""}`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      active ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
