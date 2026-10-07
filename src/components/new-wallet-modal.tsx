"use client";

import React, { useState } from "react";
import { Plus, Wallet, Loader2, X } from "lucide-react";
import { createWalletAction } from "@/actions/wallets";
import { useRouter } from "next/navigation";

const WALLET_TYPES = [
  { value: "cash", label: "Efectivo", icon: "💵" },
  { value: "bank", label: "Cuenta Bancaria / Débito", icon: "🏦" },
  { value: "credit_card", label: "Tarjeta de Crédito", icon: "💳" },
  { value: "savings", label: "Cuenta de Ahorro / Inversión", icon: "📈" },
  { value: "other", label: "Otro", icon: "🪙" },
];

const COLORS = [
  "#047857", // Emerald Corporativo
  "#D4AF37", // Gold Corporativo
  "#059669", // Emerald Light
  "#E3BF63", // Gold Light
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#EF4444", // Red
];

export function NewWalletModal({ defaultCurrency = "CLP" }: { defaultCurrency?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"cash" | "bank" | "credit_card" | "savings" | "other">("bank");
  const [initialBalance, setInitialBalance] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const parsedBalance = parseFloat(initialBalance.replace(/\./g, "").replace(",", ".")) || 0;

      const res = await createWalletAction({
        name,
        type,
        currency,
        initialBalance: parsedBalance,
        color,
        icon: "Wallet",
      });

      if (!res.success) {
        setError(res.error || "Error al crear la billetera");
        setLoading(false);
        return;
      }

      setIsOpen(false);
      setName("");
      setInitialBalance("");
      router.refresh();
    } catch (err) {
      setError("Error inesperado en el cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/50 bg-[#0E1712] px-3 py-1.5 text-xs font-bold text-[#D4AF37] transition-all hover:bg-[#047857]/25 hover:border-[#D4AF37]"
      >
        <Plus className="h-3.5 w-3.5" /> Agregar Billetera
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#047857]/40 bg-[#0E1712] p-6 text-zinc-100 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#047857]/20">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-[#D4AF37]" />
                <h3 className="text-base font-bold text-white">Agregar Nueva Billetera</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {error && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Nombre de la Cuenta / Billetera
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Banco Estado, Billetera Efectivo, Santander..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[#047857]/30 bg-[#090D0B] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Tipo de Cuenta
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-xl border border-[#047857]/30 bg-[#090D0B] px-3 py-2.5 text-sm text-zinc-100 focus:border-[#D4AF37] focus:outline-none"
                  >
                    {WALLET_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Moneda
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-[#047857]/30 bg-[#090D0B] px-3 py-2.5 text-sm text-zinc-100 focus:border-[#D4AF37] focus:outline-none"
                  >
                    <option value="CLP">CLP (Pesos Chilenos)</option>
                    <option value="USD">USD (Dólares)</option>
                    <option value="EUR">EUR (Euros)</option>
                    <option value="ARS">ARS (Pesos Arg)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Saldo Inicial / Saldo Actual
                </label>
                <input
                  type="text"
                  placeholder="0 (o ej: 150000)"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full rounded-xl border border-[#047857]/30 bg-[#090D0B] px-3.5 py-2.5 text-sm font-black text-[#D4AF37] placeholder-zinc-500 focus:border-[#D4AF37] focus:outline-none"
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Este monto se sumará de inmediato a tu patrimonio total en Pari.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Color Identificador
                </label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${
                        color === c ? "scale-110 border-white ring-2 ring-[#D4AF37]/50" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#047857]/20">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[#047857] hover:bg-[#059669] border border-[#D4AF37]/40 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-[#047857]/30 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Billetera"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
