"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import LayoutWrapper from "../../components/LayoutWrapper";
import { supabase } from "../../lib/supabase";
import { Filter, Calendar, FileText } from "lucide-react";
import FilterBulanTahun from "../../components/FilterBulanTahun";

const RiwayatTransaksi = dynamic(
  () => import("../../components/RiwayatTransaksi"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Memuat riwayat...</div>
        </div>
      </div>
    ),
  },
);

const EditTransaksiModal = dynamic(
  () => import("../../components/EditTransaksiModal"),
  { ssr: false },
);

const ExportPdfModal = dynamic(
  () => import("../../components/ExportPdfModal"),
  { ssr: false },
);

export default function RiwayatPage() {
  const [refresh, setRefresh] = useState(0);
  const [editingTransaksi, setEditingTransaksi] = useState(null);
  const [sumberDanaList, setSumberDanaList] = useState([]);
  const [selectedSumberDana, setSelectedSumberDana] = useState("all");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    fetchSumberDana();
  }, []);

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSumberDana, bulan, tahun, refresh]);

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

  const handleEdit = (transaksi) => {
    setEditingTransaksi(transaksi);
  };

  const resetFilters = () => {
    setSelectedSumberDana("all");
    setBulan(new Date().getMonth() + 1);
    setTahun(new Date().getFullYear());
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedSumberDana !== "all" ||
    bulan !== new Date().getMonth() + 1 ||
    tahun !== new Date().getFullYear();

  return (
    <LayoutWrapper>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Riwayat Transaksi 📜
            </h1>
            <p className="text-gray-500">Lihat, edit, atau hapus transaksi</p>
          </div>
          <div>
            <button
              onClick={() => setIsExportOpen(true)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              Export Rekap PDF
            </button>
          </div>
        </motion.div>

        {/* Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          {/* Filter Bulan & Tahun */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-50 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-700">Filter Periode</h3>
            </div>
            <FilterBulanTahun
              bulan={bulan}
              tahun={tahun}
              onBulanChange={setBulan}
              onTahunChange={setTahun}
            />
          </div>

          {/* Filter Sumber Dana */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-700">Filter Sumber Dana</h3>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
            </div>
          </div>

          {/* Reset Filter Button */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Reset Semua Filter
              </button>
            </div>
          )}
        </motion.div>

        <RiwayatTransaksi
          refreshTrigger={refresh}
          onEdit={handleEdit}
          selectedSumberDana={selectedSumberDana}
          bulan={bulan}
          tahun={tahun}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />

        {editingTransaksi && (
          <EditTransaksiModal
            transaksi={editingTransaksi}
            onClose={() => setEditingTransaksi(null)}
            onSuccess={() => {
              handleSuccess();
              setEditingTransaksi(null);
            }}
          />
        )}

        <ExportPdfModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      </div>
    </LayoutWrapper>
  );
}
