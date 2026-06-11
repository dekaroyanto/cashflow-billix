"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import LayoutWrapper from "../components/LayoutWrapper";
import { supabase } from "../lib/supabase";
import { Filter, PlusCircle, MinusCircle } from "lucide-react";
import { Button } from "../components/ui/button";

const SaldoCard = dynamic(() => import("../components/SaldoCard"), {
  ssr: false,
  loading: () => (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
      <p className="text-center">Memuat saldo...</p>
    </div>
  ),
});

export default function DashboardPage() {
  const router = useRouter();
  const [refresh, setRefresh] = useState(0);
  const [sumberDanaList, setSumberDanaList] = useState([]);
  const [selectedSumberDana, setSelectedSumberDana] = useState("all");

  useEffect(() => {
    fetchSumberDana();
  }, []);

  const fetchSumberDana = async () => {
    const { data } = await supabase
      .from("sumberdana")
      .select("id, nama_bank")
      .order("nama_bank");
    if (data) {
      setSumberDanaList(data);
    }
  };

  const handleSuccess = () => {
    setRefresh((prev) => prev + 1);
  };

  return (
    <LayoutWrapper>
      <div className="max-w-5xl mx-auto">
        {/* Header Greeting dan Tombol Aksi */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Cashflow Billix 🚀
            </h1>
          </div>

          {/* Tombol Aksi Desktop */}
          <div className="hidden md:flex gap-3">
            <Button
              onClick={() => router.push("/pemasukan")}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Catat Pemasukan
            </Button>
            <Button
              onClick={() => router.push("/pengeluaran")}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <MinusCircle className="h-4 w-4 mr-2" />
              Catat Pengeluaran
            </Button>
          </div>
        </motion.div>

        {/* Filter Sumber Dana */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="bg-blue-50 p-2 rounded-lg shrink-0">
                  <Filter className="h-5 w-5 text-blue-600" />
                </div>
                <label className="block text-sm font-medium text-gray-700 sm:hidden">
                  Filter Sumber Dana
                </label>
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <select
                  value={selectedSumberDana}
                  onChange={(e) => setSelectedSumberDana(e.target.value)}
                  className="w-full sm:w-80 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white text-sm"
                >
                  <option value="all">Semua Sumber Dana</option>
                  {sumberDanaList.map((sd) => (
                    <option key={sd.id} value={sd.id}>
                      {sd.nama_bank}
                    </option>
                  ))}
                </select>
              </div>
              {selectedSumberDana !== "all" && (
                <button
                  onClick={() => setSelectedSumberDana("all")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Saldo Section */}
        <div className="mb-6">
          <SaldoCard
            key={refresh}
            refreshTrigger={refresh}
            selectedSumberDana={selectedSumberDana}
          />
        </div>

        {/* Tips Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">
                Tips Keuangan
              </h3>
              <p className="text-sm text-gray-600">
                Catat setiap transaksi secara rutin. Gunakan tombol di atas
                untuk mencatat pemasukan atau pengeluaran dengan cepat!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </LayoutWrapper>
  );
}
