"use client";

import React, { useState, useEffect } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  Plus,
  Loader2,
  X,
  CreditCard,
  Tag,
  Calendar,
  FileText,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { parseVoiceInput, ParsedVoiceTransaction } from "@/lib/voice-parser";
import {
  createPersonalTransactionAction,
  createBatchTransactionsAction,
} from "@/actions/transactions";
import { useRouter } from "next/navigation";

export interface WalletOption {
  id: string;
  name: string;
  currency: string;
  type: string;
  color?: string;
  isDefault?: boolean;
}

export interface CategoryOption {
  id: string;
  name: string;
  type: string;
  icon?: string;
}

interface TransactionModalProps {
  wallets: WalletOption[];
  categories: CategoryOption[];
  defaultCurrency?: string;
  onSuccess?: () => void;
}

export function VoiceEntryButton({
  wallets,
  categories,
  defaultCurrency = "CLP",
  onSuccess,
}: TransactionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"manual" | "voice">("manual");
  const router = useRouter();

  // Estado Modo Manual
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState(
    wallets[0]?.id || ""
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Estado Modo Voz / Dictado
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedItems, setParsedItems] = useState<ParsedVoiceTransaction[]>([]);

  // Estados generales
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar billetera por defecto si cambia la lista
  useEffect(() => {
    if (!selectedWalletId && wallets.length > 0) {
      const defaultW = wallets.find((w) => w.isDefault) || wallets[0];
      setSelectedWalletId(defaultW.id);
    }
  }, [wallets, selectedWalletId]);

  // Filtrar categorías según tipo (gasto o ingreso)
  const filteredCategories = categories.filter((c) => c.type === type);

  // Parser reactivo para modo voz
  useEffect(() => {
    if (transcript) {
      const items = parseVoiceInput(transcript);
      setParsedItems(items);
    } else {
      setParsedItems([]);
    }
  }, [transcript]);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Tu navegador no soporta Web Speech API. Puedes escribir directamente la frase.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-CL";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      let current = "";
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // Guardar Transacción Manual
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const parsedAmount = parseFloat(amount.replace(/\./g, "").replace(",", "."));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Por favor ingresa un monto válido mayor a 0.");
        setIsSaving(false);
        return;
      }

      if (!selectedWalletId) {
        setError("Debes seleccionar una billetera de origen.");
        setIsSaving(false);
        return;
      }

      const activeWallet = wallets.find((w) => w.id === selectedWalletId);
      const currency = activeWallet?.currency || defaultCurrency;

      const res = await createPersonalTransactionAction({
        walletId: selectedWalletId,
        categoryId: selectedCategoryId || undefined,
        type: type,
        amount: parsedAmount,
        currency: currency,
        date: new Date(date),
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || "Error al registrar el movimiento.");
        setIsSaving(false);
        return;
      }

      setIsOpen(false);
      setAmount("");
      setNotes("");
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError("Error inesperado al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar Transacciones Detectadas por Voz
  const handleSaveVoiceItems = async () => {
    if (parsedItems.length === 0) return;
    setError(null);
    setIsSaving(true);

    try {
      const activeWallet = wallets.find((w) => w.id === selectedWalletId) || wallets[0];
      if (!activeWallet) {
        setError("Necesitas al menos una billetera creada para guardar movimientos.");
        setIsSaving(false);
        return;
      }

      const transactionsToSave = parsedItems.map((item) => {
        const matchedCategory = categories.find((c) =>
          c.name.toLowerCase().includes(item.categoryHint?.toLowerCase() || "")
        );

        let targetWalletId = activeWallet.id;
        if (item.walletHint) {
          const matchingWallet = wallets.find((w) => w.type === item.walletHint);
          if (matchingWallet) targetWalletId = matchingWallet.id;
        }

        return {
          walletId: targetWalletId,
          categoryId: matchedCategory?.id || undefined,
          type: "expense" as const,
          amount: item.amount,
          currency: activeWallet.currency,
          date: new Date(),
          notes: item.concept,
        };
      });

      const res = await createBatchTransactionsAction(transactionsToSave);

      if (!res.success) {
        setError(res.error || "Error al procesar las transacciones.");
        setIsSaving(false);
        return;
      }

      setIsOpen(false);
      setTranscript("");
      setParsedItems([]);
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError("Error inesperado al guardar los gastos por voz.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Botón Flotante (FAB) con Emerald #047857 y Aro Dorado #D4AF37 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#047857] hover:bg-[#059669] text-white shadow-2xl shadow-[#047857]/50 border-2 border-[#D4AF37]/70 transition-all hover:scale-105 active:scale-95 focus:outline-none"
        aria-label="Registrar nuevo movimiento"
      >
        <Plus className="h-7 w-7 text-white drop-shadow" />
      </button>

      {/* Modal / Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#0E1712] border border-[#047857]/40 p-6 shadow-2xl shadow-black text-zinc-100 animate-in fade-in-50 slide-in-from-bottom-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#047857]/20">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#047857]/20 border border-[#D4AF37]/40 text-[#D4AF37]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-base text-white">Registrar Movimiento</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Pestañas: Manual vs Voz con toques Dorados */}
            <div className="mt-4 flex rounded-xl bg-[#090D0B] p-1 border border-[#047857]/30 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode("manual");
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-2 transition-all flex items-center justify-center gap-1.5 ${
                  mode === "manual"
                    ? "bg-[#047857] text-white shadow-md border border-[#D4AF37]/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Plus className="h-3.5 w-3.5" /> Entrada Manual
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("voice");
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-2 transition-all flex items-center justify-center gap-1.5 ${
                  mode === "voice"
                    ? "bg-[#047857] text-[#D4AF37] shadow-md border border-[#D4AF37]/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Mic className="h-3.5 w-3.5" /> Voz & Dictado
              </button>
            </div>

            {error && (
              <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                {error}
              </div>
            )}

            {mode === "manual" ? (
              /* FORMULARIO MANUAL */
              <form onSubmit={handleSaveManual} className="mt-4 space-y-4">
                {/* Selector Tipo: Gasto / Ingreso */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("expense")}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all border ${
                      type === "expense"
                        ? "bg-rose-500/15 border-rose-500/50 text-rose-400 shadow-sm"
                        : "border-[#047857]/20 bg-[#090D0B] text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <TrendingDown className="h-4 w-4" /> Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("income")}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all border ${
                      type === "income"
                        ? "bg-[#047857]/20 border-[#D4AF37]/50 text-[#D4AF37] shadow-sm"
                        : "border-[#047857]/20 bg-[#090D0B] text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" /> Ingreso
                  </button>
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Monto
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-lg font-bold text-[#D4AF37]">
                      $
                    </span>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-xl border border-[#047857]/30 bg-[#090D0B] pl-8 pr-4 py-2.5 text-xl font-black text-white placeholder-zinc-600 focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Billetera y Categoría */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                      <CreditCard className="h-3.5 w-3.5 text-[#D4AF37]" /> Billetera
                    </label>
                    <select
                      value={selectedWalletId}
                      onChange={(e) => setSelectedWalletId(e.target.value)}
                      className="w-full rounded-xl border border-[#047857]/30 bg-[#090D0B] px-3 py-2.5 text-xs font-medium text-zinc-200 focus:border-[#D4AF37] focus:outline-none"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.currency})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5 text-[#34d399]" /> Categoría
                    </label>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="w-full rounded-xl border border-[#047857]/30 bg-[#090D0B] px-3 py-2.5 text-xs font-medium text-zinc-200 focus:border-[#D4AF37] focus:outline-none"
                    >
                      <option value="">(Sin categoría)</option>
                      {filteredCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Detalle / Notas */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-zinc-500" /> Concepto / Notas
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Almuerzo ejecutivo, Sueldo, Supermercado..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-[#047857]/30 bg-[#090D0B] px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-zinc-500" /> Fecha
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-[#047857]/30 bg-[#090D0B] px-3.5 py-2 text-xs text-zinc-200 focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving || !amount.trim()}
                    className="w-full py-3.5 rounded-xl bg-[#047857] hover:bg-[#059669] disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#047857]/30 border border-[#D4AF37]/40"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                      </>
                    ) : (
                      `Registrar ${type === "expense" ? "Gasto" : "Ingreso"}`
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* FORMULARIO DE VOZ Y DICTADO */
              <div className="mt-4 space-y-4">
                <p className="text-xs text-zinc-400">
                  Presiona el micrófono o escribe frases compuestas como: <br />
                  <span className="italic text-[#D4AF37] font-medium">
                    "Almuerzo 12000 en efectivo y café 3500 con tarjeta"
                  </span>
                </p>

                <div className="relative">
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Dicta o escribe aquí tus gastos..."
                    rows={3}
                    className="w-full rounded-xl bg-[#090D0B] border border-[#047857]/30 p-3 pr-12 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={startListening}
                    className={`absolute right-3 top-3 p-2 rounded-lg transition-colors ${
                      isListening
                        ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30"
                        : "bg-[#0E1712] text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#047857]/20"
                    }`}
                    title={isListening ? "Escuchando..." : "Iniciar micrófono"}
                  >
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                </div>

                {/* Previsualización de elementos parseados */}
                {parsedItems.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                      Movimientos detectados ({parsedItems.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {parsedItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#090D0B] border border-[#047857]/30"
                        >
                          <div>
                            <p className="font-semibold text-sm text-zinc-200">{item.concept}</p>
                            <span className="text-[11px] text-zinc-400">
                              {item.categoryHint || "General"} • {item.walletHint || "Efectivo"}
                            </span>
                          </div>
                          <div className="text-[#D4AF37] font-extrabold text-base">
                            ${item.amount.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={parsedItems.length === 0 || isSaving}
                    onClick={handleSaveVoiceItems}
                    className="w-full py-3.5 rounded-xl bg-[#047857] hover:bg-[#059669] disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#047857]/30 border border-[#D4AF37]/40"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Guardando en Neon...
                      </>
                    ) : (
                      `Confirmar y Guardar (${parsedItems.length}) en Neon`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
