"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Building2, Plus } from "lucide-react";
import {
  showSuccess,
  showError,
  showLoading,
  closeLoading,
} from "../lib/alert";

export default function SumberDanaForm({ onSuccess }) {
  const [namaBank, setNamaBank] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!namaBank.trim()) {
      showError("Nama bank tidak boleh kosong!");
      return;
    }

    setLoading(true);
    showLoading("Menambahkan sumber dana...");

    const { error } = await supabase
      .from("sumberdana")
      .insert([{ nama_bank: namaBank }]);

    closeLoading();

    if (error) {
      if (error.code === "23505") {
        showError("Nama bank sudah terdaftar!");
      } else {
        showError(error.message);
      }
    } else {
      showSuccess("Sumber dana berhasil ditambahkan!", "Sukses!");
      setNamaBank("");
      if (onSuccess) onSuccess();
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-purple-50 p-2 rounded-lg">
          <Building2 className="h-5 w-5 text-purple-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">
          Tambah Sumber Dana
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          placeholder="Nama Sumber Dana"
          value={namaBank}
          onChange={(e) => setNamaBank(e.target.value)}
          className="border-gray-200 focus:border-purple-400 focus:ring-purple-400"
          required
        />
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {loading ? "Menyimpan..." : "Tambah Sumber Dana"}
        </Button>
      </form>
    </motion.div>
  );
}
