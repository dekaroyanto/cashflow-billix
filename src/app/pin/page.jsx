// app/pin/page.jsx
"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { Fingerprint, Shield, AlertCircle, Eye, EyeOff } from "lucide-react";

function PinForm() {
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRefs = useRef([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const CORRECT_PIN = "662026";

  // Auto focus ke input pertama
  useEffect(() => {
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 100);
  }, []);

  const handlePinChange = (index, value) => {
    const newPin = [...pin];
    newPin[index] = value;
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

  const handleSubmit = async (fullPin) => {
    if (fullPin.length !== 6) return;

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

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
      // Hanya tampilkan error, tanpa batasan percobaan
      setError("PIN yang Anda masukkan salah");
      setPin(["", "", "", "", "", ""]);
      setLoading(false);

      // Hapus error setelah 2 detik
      setTimeout(() => setError(""), 2000);

      // Fokus ke input pertama
      inputRefs.current[0]?.focus();
    }
  };

  // Fungsi untuk numpad virtual
  const handleNumpadClick = (num) => {
    if (loading) return;

    // Cari input kosong pertama
    const emptyIndex = pin.findIndex((digit) => digit === "");
    if (emptyIndex !== -1) {
      handlePinChange(emptyIndex, num.toString());
    }
  };

  // Fungsi hapus - menghapus digit terakhir
  const handleDelete = () => {
    if (loading) return;

    // Cari index terakhir yang terisi (dari kanan ke kiri)
    let lastFilledIndex = -1;
    for (let i = pin.length - 1; i >= 0; i--) {
      if (pin[i] !== "") {
        lastFilledIndex = i;
        break;
      }
    }

    if (lastFilledIndex !== -1) {
      const newPin = [...pin];
      newPin[lastFilledIndex] = "";
      setPin(newPin);
      // Fokus ke input yang baru saja dihapus
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const handleClear = () => {
    if (loading) return;
    setPin(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
            <div className="mb-2">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">CashFlow Billix</h1>
          </div>

          {/* Body */}
          <div className="p-8">
            {/* PIN Display */}
            <div className="flex justify-center gap-3 mb-8">
              {pin.map((digit, index) => (
                <div key={index} className="relative">
                  <input
                    ref={(el) => (inputRefs.current[index] = el)}
                    type={showPassword ? "text" : "password"}
                    value={digit}
                    onChange={() => {}} // Kosongkan untuk mencegah keyboard
                    onClick={(e) => {
                      e.preventDefault();
                      inputRefs.current[index]?.focus();
                    }}
                    onFocus={(e) => {
                      e.target.setAttribute("readonly", "readonly");
                    }}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-colors cursor-default"
                    style={{
                      borderColor: error ? "#ef4444" : "#e5e7eb",
                      boxShadow: digit
                        ? "0 0 0 2px rgba(59,130,246,0.2)"
                        : "none",
                    }}
                    disabled={loading}
                    readOnly
                    autoComplete="off"
                  />
                  {digit && !showPassword && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-red-600 text-sm text-center flex-1">
                  {error}
                </p>
              </div>
            )}

            {/* Show/Hide PIN Toggle */}
            <div className="flex justify-center mb-6">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {showPassword ? "Sembunyikan PIN" : "Lihat PIN"}
              </button>
            </div>

            {/* Numpad Virtual */}
            <div className="space-y-3">
              {/* Baris 1: 1 2 3 */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleNumpadClick(1)}
                  disabled={loading}
                  className="h-16 text-2xl font-semibold bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 active:scale-95 transform"
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadClick(2)}
                  disabled={loading}
                  className="h-16 text-2xl font-semibold bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 active:scale-95 transform"
                >
                  2
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadClick(3)}
                  disabled={loading}
                  className="h-16 text-2xl font-semibold bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 active:scale-95 transform"
                >
                  3
                </button>
              </div>

              {/* Baris 2: 4 5 6 */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleNumpadClick(4)}
                  disabled={loading}
                  className="h-16 text-2xl font-semibold bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 active:scale-95 transform"
                >
                  4
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadClick(5)}
                  disabled={loading}
                  className="h-16 text-2xl font-semibold bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 active:scale-95 transform"
                >
                  5
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadClick(6)}
                  disabled={loading}
                  className="h-16 text-2xl font-semibold bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 active:scale-95 transform"
                >
                  6
                </button>
              </div>

              {/* Baris 3: 7 8 9 */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleNumpadClick(7)}
                  disabled={loading}
                  className="h-16 text-2xl font-semibold bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 active:scale-95 transform"
                >
                  7
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadClick(8)}
                  disabled={loading}
                  className="h-16 text-2xl font-semibold bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 active:scale-95 transform"
                >
                  8
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadClick(9)}
                  disabled={loading}
                  className="h-16 text-2xl font-semibold bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 active:scale-95 transform"
                >
                  9
                </button>
              </div>

              {/* Baris 4: Clear 0 Delete */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={loading}
                  className="h-16 text-sm font-medium bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 rounded-xl transition-colors disabled:opacity-50 active:scale-95 transform"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadClick(0)}
                  disabled={loading}
                  className="h-16 text-2xl font-semibold bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 active:scale-95 transform"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="h-16 text-2xl font-medium bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 active:scale-95 transform flex items-center justify-center"
                >
                  ⌫
                </button>
              </div>
            </div>
          </div>
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

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
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
