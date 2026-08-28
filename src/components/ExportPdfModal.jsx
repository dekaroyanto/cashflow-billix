"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Calendar, Wallet, Check } from "lucide-react";
import { showError, showSuccess, showWarning, showLoading, closeLoading } from "../lib/alert";

export default function ExportPdfModal({ isOpen, onClose }) {
  const [useFilter, setUseFilter] = useState(false);
  const [startBulan, setStartBulan] = useState(new Date().getMonth() + 1);
  const [startTahun, setStartTahun] = useState(new Date().getFullYear());
  const [endBulan, setEndBulan] = useState(new Date().getMonth() + 1);
  const [endTahun, setEndTahun] = useState(new Date().getFullYear());
  const [sumberDanaFilter, setSumberDanaFilter] = useState("all");
  const [sumberDanaList, setSumberDanaList] = useState([]);
  const [loading, setLoading] = useState(false);

  const bulanList = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const tahunList = [];
  const tahunSekarang = new Date().getFullYear();
  // Display years: 3 years back to 1 year forward
  for (let i = tahunSekarang - 3; i <= tahunSekarang + 1; i++) {
    tahunList.push(i);
  }

  useEffect(() => {
    if (isOpen) {
      fetchSumberDana();
    }
  }, [isOpen]);

  const fetchSumberDana = async () => {
    const { data, error } = await supabase
      .from("sumberdana")
      .select("id, nama_bank")
      .order("nama_bank");
    if (data && !error) {
      setSumberDanaList(data);
    }
  };

  const formatRupiah = (nominal) => {
    return "Rp " + nominal.toLocaleString("id-ID");
  };

  const handleExport = async () => {
    if (useFilter) {
      const startCode = startTahun * 12 + startBulan;
      const endCode = endTahun * 12 + endBulan;
      if (startCode > endCode) {
        showWarning(
          "Bulan/Tahun Mulai tidak boleh melebihi Bulan/Tahun Selesai.",
          "Filter Tidak Valid"
        );
        return;
      }
    }

    setLoading(true);
    showLoading("Mengambil data riwayat...");

    try {
      // 1. Fetch Sumber Dana mapping
      const { data: sdData, error: sdError } = await supabase
        .from("sumberdana")
        .select("id, nama_bank");

      if (sdError) throw sdError;

      const sdMap = {};
      sdData?.forEach((sd) => {
        sdMap[sd.id] = sd.nama_bank;
      });

      // 2. Fetch Pemasukan and Pengeluaran
      const { data: pemData, error: pemError } = await supabase
        .from("pemasukan")
        .select("id, tanggal, keterangan, nominal, sumberdana_id");

      if (pemError) throw pemError;

      const { data: pengData, error: pengError } = await supabase
        .from("pengeluaran")
        .select("id, tanggal, keterangan, nominal, sumberdana_id");

      if (pengError) throw pengError;

      // 3. Combine with tags
      const allTx = [
        ...(pemData?.map((p) => ({ ...p, type: "pemasukan" })) || []),
        ...(pengData?.map((p) => ({ ...p, type: "pengeluaran" })) || []),
      ];

      // 4. Filter by Bank / Sumber Dana
      let filtered = [...allTx];
      if (sumberDanaFilter !== "all") {
        filtered = filtered.filter(
          (t) => t.sumberdana_id === parseInt(sumberDanaFilter)
        );
      }

      // 5. Filter by Date Range (Months and Years)
      if (useFilter) {
        const startCode = startTahun * 12 + startBulan;
        const endCode = endTahun * 12 + endBulan;

        filtered = filtered.filter((t) => {
          const d = new Date(t.tanggal);
          const tCode = d.getFullYear() * 12 + (d.getMonth() + 1);
          return tCode >= startCode && tCode <= endCode;
        });
      }

      // 6. Sort by date ascending (chronological report)
      filtered.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

      if (filtered.length === 0) {
        closeLoading();
        showWarning("Tidak ada transaksi ditemukan untuk filter yang dipilih.", "Data Kosong");
        setLoading(false);
        return;
      }

      // 7. Calculate Summaries
      const totalPemasukan = filtered
        .filter((t) => t.type === "pemasukan")
        .reduce((sum, t) => sum + t.nominal, 0);

      const totalPengeluaran = filtered
        .filter((t) => t.type === "pengeluaran")
        .reduce((sum, t) => sum + t.nominal, 0);

      const saldo = totalPemasukan - totalPengeluaran;

      // 8. Generate PDF
      showLoading("Sedang merender laporan PDF...");

      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();

      // Premium Header Design
      doc.setFillColor(37, 99, 235); // Blue-600
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 35, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("LAPORAN REKAPITULASI CASHFLOW", 14, 15);

      // Subtitle information
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(239, 246, 255); // Blue-50
      const periodeText = useFilter
        ? `Periode: ${bulanList[startBulan - 1]} ${startTahun} s/d ${bulanList[endBulan - 1]} ${endTahun}`
        : "Periode: Semua Tanggal (Seluruh Periode)";
      const bankText = sumberDanaFilter !== "all"
        ? `Sumber Dana: ${sdMap[sumberDanaFilter]}`
        : "Sumber Dana: Semua Sumber Dana";
      doc.text(`${periodeText}   |   ${bankText}`, 14, 21);

      // Generation time stamp
      const now = new Date();
      const printTime = now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      });
      doc.text(`Tanggal Cetak: ${printTime} WIB`, 14, 27);

      // Title Section: Summary Card
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text("Ringkasan Laporan", 14, 46);

      // Summary Table
      const summaryHeaders = [["Total Pemasukan", "Total Pengeluaran", "Selisih / Saldo Akhir"]];
      const summaryData = [
        [
          formatRupiah(totalPemasukan),
          formatRupiah(totalPengeluaran),
          `${saldo >= 0 ? "+" : "-"} ${formatRupiah(Math.abs(saldo))}`,
        ],
      ];

      autoTable(doc, {
        startY: 50,
        head: summaryHeaders,
        body: summaryData,
        theme: "grid",
        headStyles: {
          fillColor: [79, 70, 229], // Indigo-600
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
          halign: "center",
        },
        bodyStyles: {
          fontSize: 10,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          2: { textColor: saldo >= 0 ? [22, 163, 74] : [220, 38, 38] }, // Green or Red
        },
        margin: { left: 14, right: 14 },
      });

      // Detail Table Title
      const detailStartY = doc.lastAutoTable.finalY + 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("Daftar Detail Transaksi", 14, detailStartY);

      // Prepare Transaction Table Data
      const txHeaders = [["No", "Tanggal", "Keterangan", "Tipe", "Sumber Dana", "Nominal"]];
      const txData = filtered.map((t, index) => {
        const tDate = new Date(t.tanggal).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const typeText = t.type === "pemasukan" ? "Pemasukan" : "Pengeluaran";
        const sign = t.type === "pemasukan" ? "+" : "-";
        return [
          index + 1,
          tDate,
          t.keterangan,
          typeText,
          sdMap[t.sumberdana_id] || "-",
          `${sign} ${formatRupiah(t.nominal)}`,
        ];
      });

      autoTable(doc, {
        startY: detailStartY + 4,
        head: txHeaders,
        body: txData,
        theme: "striped",
        headStyles: {
          fillColor: [30, 41, 59], // Slate-800
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 9,
        },
        columnStyles: {
          0: { width: 10, halign: "center" },
          1: { width: 28 },
          2: { cellWidth: "auto" },
          3: { width: 24 },
          4: { width: 30 },
          5: { width: 35, halign: "right" },
        },
        didParseCell: function (data) {
          if (data.column.index === 5 && data.cell.section === "body") {
            const isPemasukan = data.row.raw[3] === "Pemasukan";
            data.cell.styles.textColor = isPemasukan ? [22, 163, 74] : [220, 38, 38];
            data.cell.styles.fontStyle = "bold";
          }
          if (data.column.index === 3 && data.cell.section === "body") {
            const isPemasukan = data.cell.raw === "Pemasukan";
            data.cell.styles.textColor = isPemasukan ? [22, 163, 74] : [220, 38, 38];
            data.cell.styles.fontStyle = "bold";
          }
        },
        margin: { left: 14, right: 14 },
      });

      // Footer page numbering
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Halaman ${i} dari ${pageCount} | Laporan otomatis dari CashFlow Billix`,
          14,
          doc.internal.pageSize.getHeight() - 10
        );
      }

      // Download file naming
      const periodName = useFilter
        ? `${bulanList[startBulan - 1]}_${startTahun}_ke_${bulanList[endBulan - 1]}_${endTahun}`
        : "Semua_Tanggal";
      const filename = `Rekap_Cashflow_${periodName}.pdf`;

      doc.save(filename);
      closeLoading();
      showSuccess("PDF Rekap berhasil diunduh!", "Export Sukses");
      onClose();
    } catch (err) {
      console.error(err);
      closeLoading();
      showError(`Gagal melakukan export: ${err.message}`, "Export Gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Modal content wrapper */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg px-4"
          >
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    Export Rekap PDF
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-6">
                {/* 1. Sumber Dana Filter */}
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium text-sm flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-blue-500" />
                    Pilih Sumber Dana
                  </Label>
                  <select
                    value={sumberDanaFilter}
                    onChange={(e) => setSumberDanaFilter(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white text-sm"
                  >
                    <option value="all">Semua Sumber Dana</option>
                    {sumberDanaList.map((sd) => (
                      <option key={sd.id} value={sd.id}>
                        {sd.nama_bank}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Choose Filter Mode - Card Selector style (Premium) */}
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium text-sm">
                    Mode Filter Tanggal
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Card A: All Dates */}
                    <div
                      onClick={() => setUseFilter(false)}
                      className={`cursor-pointer border rounded-xl p-4 flex items-start gap-3 transition-all relative ${
                        !useFilter
                          ? "border-blue-500 bg-blue-50/50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-800">
                          Semua Tanggal
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Export semua riwayat tanpa batasan periode
                        </div>
                      </div>
                      {!useFilter && (
                        <div className="bg-blue-600 text-white rounded-full p-0.5 shrink-0">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Card B: Range Filter */}
                    <div
                      onClick={() => setUseFilter(true)}
                      className={`cursor-pointer border rounded-xl p-4 flex items-start gap-3 transition-all relative ${
                        useFilter
                          ? "border-blue-500 bg-blue-50/50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-800">
                          Range Bulan & Tahun
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Tentukan filter range bulan dan tahun laporan
                        </div>
                      </div>
                      {useFilter && (
                        <div className="bg-blue-600 text-white rounded-full p-0.5 shrink-0">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Range Inputs (visible only if useFilter is true) */}
                <AnimatePresence>
                  {useFilter && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-4 pt-2"
                    >
                      {/* Start Date */}
                      <div className="border border-blue-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Mulai Dari Periode:
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Label className="text-xs text-gray-500 mb-1 block">
                              Bulan
                            </Label>
                            <select
                              value={startBulan}
                              onChange={(e) => setStartBulan(parseInt(e.target.value))}
                              className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white text-sm"
                            >
                              {bulanList.map((b, idx) => (
                                <option key={idx} value={idx + 1}>
                                  {b}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs text-gray-500 mb-1 block">
                              Tahun
                            </Label>
                            <select
                              value={startTahun}
                              onChange={(e) => setStartTahun(parseInt(e.target.value))}
                              className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white text-sm"
                            >
                              {tahunList.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* End Date */}
                      <div className="border border-blue-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Sampai Dengan Periode:
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Label className="text-xs text-gray-500 mb-1 block">
                              Bulan
                            </Label>
                            <select
                              value={endBulan}
                              onChange={(e) => setEndBulan(parseInt(e.target.value))}
                              className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white text-sm"
                            >
                              {bulanList.map((b, idx) => (
                                <option key={idx} value={idx + 1}>
                                  {b}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs text-gray-500 mb-1 block">
                              Tahun
                            </Label>
                            <select
                              value={endTahun}
                              onChange={(e) => setEndTahun(parseInt(e.target.value))}
                              className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white text-sm"
                            >
                              {tahunList.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Buttons Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 text-gray-600 border-gray-200 hover:bg-gray-50 text-sm py-2.5 h-auto rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExport}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 h-auto rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {loading ? "Mengeksport..." : "Export Laporan"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
