// app/pin/page.jsx
"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { Keypad, Fingerprint, ArrowLeft, Clock } from "lucide-react";

function PinForm() {
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  const inputRefs = useRef([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const CORRECT_PIN = "662026";

  // Cek sesi yang masih aktif
  useEffect(() => {
    const pinVerified = Cookies.get("pin_verified");
    const pinTime = Cookies.get("pin_time");

    if (pinVerified === "true" && pinTime) {
      const currentTime = Date.now();
      const verifiedTime = parseInt(pinTime);
      const timeDiff = (currentTime - verifiedTime) / 1000;

      if (timeDiff < 300) {
        router.push(redirectTo);
      } else if (timeDiff < 300 && timeDiff > 0) {
        setRemainingTime(Math.floor(300 - timeDiff));
      }
    }
  }, [router, redirectTo]);

  // Auto focus ke input pertama
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handlePinChange = (index, value) => {
    // Hanya terima angka
    if (value && !/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1); // Ambil karakter terakhir saja
    setPin(newPin);

    // Auto pindah ke input berikutnya
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Jika semua input terisi
    if (index === 5 && value) {
      handleSubmit(newPin.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace") {
      if (!pin[index] && index > 0) {
        // Kosongkan input sebelumnya
        const newPin = [...pin];
        newPin[index - 1] = "";
        setPin(newPin);
        inputRefs.current[index - 1]?.focus();
      } else if (pin[index]) {
        // Kosongkan input saat ini
        const newPin = [...pin];
        newPin[index] = "";
        setPin(newPin);
      }
    }
  };

  const handleSubmit = async (fullPin) => {
    if (fullPin.length !== 6) return;

    setLoading(true);

    // Simulasi delay verifikasi
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (fullPin === CORRECT_PIN) {
      const currentTime = Date.now();
      Cookies.set("pin_verified", "true", {
        expires: 1,
        path: "/",
        sameSite: "lax",
      });
      Cookies.set("pin_time", currentTime.toString(), {
        expires: 1,
        path: "/",
        sameSite: "lax",
      });

      router.push(redirectTo);
    } else {
      setError("PIN yang Anda masukkan salah");
      setPin(["", "", "", "", "", ""]);
      setLoading(false);

      // Reset focus ke input pertama
      inputRefs.current[0]?.focus();

      // Hapus error setelah 3 detik
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleNumpadClick = (num) => {
    // Cari input kosong pertama
    const emptyIndex = pin.findIndex((digit) => digit === "");
    if (emptyIndex !== -1) {
      handlePinChange(emptyIndex, num.toString());
    }
  };

  const handleDelete = () => {
    // Cari input terisi terakhir
    const lastFilledIndex = pin
      .map((digit, idx) => (digit !== "" ? idx : -1))
      .filter((idx) => idx !== -1)
      .pop();
    if (lastFilledIndex !== undefined) {
      const newPin = [...pin];
      newPin[lastFilledIndex] = "";
      setPin(newPin);
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const handleClear = () => {
    setPin(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  const formatRemainingTime = (seconds) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Utama */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
            <div className="mb-2">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold">CashFlow Billix</h1>
            <p className="text-blue-100 mt-1">Masukkan PIN Transaksi</p>
          </div>

          {/* Body */}
          <div className="p-8">
            {/* Timer Sesi */}
            {remainingTime && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
                <Clock className="w-4 h-4" />
                <span>
                  Sesi akan berakhir dalam {formatRemainingTime(remainingTime)}
                </span>
              </div>
            )}

            {/* PIN Input */}
            <div className="flex justify-center gap-3 mb-8">
              {pin.map((digit, index) => (
                <div key={index} className="relative">
                  <input
                    ref={(el) => (inputRefs.current[index] = el)}
                    type={showPassword ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    style={{
                      borderColor: error ? "#ef4444" : "#e5e7eb",
                      boxShadow: digit
                        ? "0 0 0 2px rgba(59,130,246,0.2)"
                        : "none",
                    }}
                    disabled={loading}
                  />
                  {digit && !showPassword && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Show/Hide PIN Toggle */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {showPassword ? "Sembunyikan PIN" : "Lihat PIN"}
              </button>
            </div>

            {/* Numpad Style Keypad */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumpadClick(num)}
                    disabled={loading}
                    className="h-16 text-2xl font-semibold bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  disabled={loading}
                  className="h-16 text-sm font-medium bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  CLEAR
                </button>
                <button
                  onClick={() => handleNumpadClick(0)}
                  disabled={loading}
                  className="h-16 text-2xl font-semibold bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  0
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="h-16 text-sm font-medium bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  ⌫
                </button>
              </div>
            </div>

            {/* Loading Overlay */}
            {loading && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 flex flex-col items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  <p className="mt-3 text-gray-600">Memverifikasi PIN...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/80 text-sm mt-6">
          Lupa PIN? Hubungi Administrator
        </p>
      </div>
    </div>
  );
}

export default function PinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <PinForm />
    </Suspense>
  );
}
