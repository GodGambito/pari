"use client";

import React, { useState } from "react";
import { Users, Plus, Loader2, X, Copy, Check, KeyRound } from "lucide-react";
import { createGroupAction, joinGroupByCodeAction } from "@/actions/groups";
import { useRouter } from "next/navigation";

export function NewGroupModal({ defaultCurrency = "CLP" }: { defaultCurrency?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"create" | "join">("create");

  // Crear grupo
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseCurrency, setBaseCurrency] = useState(defaultCurrency);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Unirse a grupo
  const [joinCode, setJoinCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await createGroupAction({
        name,
        description,
        baseCurrency,
      });

      if (!res.success) {
        setError(res.error || "Error al crear el grupo.");
        setLoading(false);
        return;
      }

      setCreatedInviteCode(res.data?.inviteCode || null);
      router.refresh();
    } catch (err) {
      setError("Error inesperado en el cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await joinGroupByCodeAction(joinCode);
      if (!res.success) {
        setError(res.error || "Código de grupo inválido");
        setLoading(false);
        return;
      }

      setIsOpen(false);
      setJoinCode("");
      router.refresh();
    } catch (err) {
      setError("Error al unirse al grupo");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (createdInviteCode) {
      navigator.clipboard.writeText(createdInviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setCreatedInviteCode(null);
    setName("");
    setDescription("");
    setJoinCode("");
    setError(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border border-[#047857]/40 bg-[#0E1712] px-3 py-1.5 text-xs font-bold text-[#34d399] transition-all hover:bg-[#047857]/25 hover:border-[#D4AF37]/60"
      >
        <Plus className="h-3.5 w-3.5" /> Crear o Unirme a Grupo
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#047857]/40 bg-[#0E1712] p-6 text-zinc-100 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#047857]/20">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#D4AF37]" />
                <h3 className="text-base font-bold text-white">Grupos Compartidos</h3>
              </div>
              <button
                onClick={resetAndClose}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Pestañas de selector */}
            {!createdInviteCode && (
              <div className="mt-4 flex rounded-xl bg-[#090D0B] p-1 border border-[#047857]/30 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setTab("create");
                    setError(null);
                  }}
                  className={`flex-1 rounded-lg py-2 transition-all ${
                    tab === "create"
                      ? "bg-[#047857] text-white shadow-md border border-[#D4AF37]/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Nuevo Grupo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("join");
                    setError(null);
                  }}
                  className={`flex-1 rounded-lg py-2 transition-all ${
                    tab === "join"
                      ? "bg-[#047857] text-[#D4AF37] shadow-md border border-[#D4AF37]/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Unirme con Código
                </button>
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                {error}
              </div>
            )}

            {/* Vista de éxito tras crear grupo */}
            {createdInviteCode ? (
              <div className="mt-4 space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#047857]/25 text-[#D4AF37] border border-[#D4AF37]/40">
                  <Check className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">¡Grupo creado con éxito!</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Comparte este código de invitación con tus amigos o familia para que se unan:
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[#090D0B] border border-[#D4AF37]/40 p-3.5 font-mono text-base font-extrabold text-[#D4AF37]">
                  <span className="tracking-widest pl-2">{createdInviteCode}</span>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 rounded-xl bg-[#047857] hover:bg-[#059669] border border-[#D4AF37]/40 px-3.5 py-1.5 text-xs font-bold text-white shadow-md"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>

                <button
                  onClick={resetAndClose}
                  className="w-full rounded-xl bg-[#090D0B] border border-[#047857]/30 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-[#047857]/20"
                >
                  Cerrar
                </button>
              </div>
            ) : tab === "create" ? (
              /* Formulario Crear Grupo */
              <form onSubmit={handleCreateGroup} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Nombre del Grupo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Viaje a Brasil, Departamento 402, Asado..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-[#047857]/30 bg-[#090D0B] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Moneda Base
                    </label>
                    <select
                      value={baseCurrency}
                      onChange={(e) => setBaseCurrency(e.target.value)}
                      className="w-full rounded-xl border border-[#047857]/30 bg-[#090D0B] px-3 py-2.5 text-sm text-zinc-100 focus:border-[#D4AF37] focus:outline-none"
                    >
                      <option value="CLP">CLP</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="ARS">ARS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Descripción (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Vacaciones 2026"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-xl border border-[#047857]/30 bg-[#090D0B] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#047857]/20">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="rounded-xl px-4 py-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="flex items-center gap-2 rounded-xl bg-[#047857] hover:bg-[#059669] border border-[#D4AF37]/40 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-[#047857]/30 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear Grupo"}
                  </button>
                </div>
              </form>
            ) : (
              /* Formulario Unirme con Código */
              <form onSubmit={handleJoinGroup} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Código de Invitación (8 caracteres)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={8}
                      placeholder="Ej: A8F9K2L1"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-[#047857]/30 bg-[#090D0B] px-3.5 py-2.5 pl-9 font-mono text-sm uppercase text-[#D4AF37] placeholder-zinc-500 focus:border-[#D4AF37] focus:outline-none font-bold"
                    />
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-[#D4AF37]/60" />
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Pídele al creador del grupo su código de invitación de 8 caracteres.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#047857]/20">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="rounded-xl px-4 py-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || joinCode.length < 4}
                    className="flex items-center gap-2 rounded-xl bg-[#047857] hover:bg-[#059669] border border-[#D4AF37]/40 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-[#047857]/30 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unirme al Grupo"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
