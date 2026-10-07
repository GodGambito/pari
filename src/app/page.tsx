import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { wallets, transactions, groupMembers, groups, categories } from "@/db/schema";
import { eq, desc, or, isNull } from "drizzle-orm";
import { formatCurrency } from "@/lib/utils";
import { SignOutButton } from "@/components/auth-buttons";
import { VoiceEntryButton } from "@/components/voice-entry-button";
import { NewWalletModal } from "@/components/new-wallet-modal";
import { NewGroupModal } from "@/components/new-group-modal";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  CreditCard,
  TrendingUp,
  Receipt,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const preferredCurrency = session.user.preferredCurrency || "CLP";

  // 1. Obtener billeteras del usuario (o crear la principal si aún no tiene)
  let userWallets = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId));

  if (userWallets.length === 0) {
    const [created] = await db
      .insert(wallets)
      .values({
        userId,
        name: "Efectivo / Cuenta Principal",
        type: "cash",
        currency: preferredCurrency,
        initialBalance: "0.00",
        currentBalance: "0.00",
        color: "#047857",
        icon: "Wallet",
        isDefault: true,
      })
      .returning();
    userWallets = [created];
  }

  // 2. Obtener categorías disponibles
  let userCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      type: categories.type,
      icon: categories.icon,
    })
    .from(categories)
    .where(or(eq(categories.userId, userId), isNull(categories.userId)));

  if (userCategories.length === 0) {
    const DEFAULT_CATS = [
      { name: "Alimentación y Supermercado", type: "expense" as const, icon: "ShoppingCart", color: "#D4AF37" },
      { name: "Restaurantes y Cafeterías", type: "expense" as const, icon: "Utensils", color: "#EF4444" },
      { name: "Transporte y Combustible", type: "expense" as const, icon: "Car", color: "#047857" },
      { name: "Vivienda y Servicios", type: "expense" as const, icon: "Home", color: "#6366F1" },
      { name: "Salud y Bienestar", type: "expense" as const, icon: "HeartPulse", color: "#EC4899" },
      { name: "Ocio y Suscripciones", type: "expense" as const, icon: "Film", color: "#8B5CF6" },
      { name: "Salario / Sueldo", type: "income" as const, icon: "Briefcase", color: "#047857" },
      { name: "Inversiones", type: "income" as const, icon: "TrendingUp", color: "#D4AF37" },
      { name: "Ingresos Extra", type: "income" as const, icon: "PlusCircle", color: "#14B8A6" },
    ];
    await db.insert(categories).values(DEFAULT_CATS.map((c) => ({ ...c, userId, isDefault: true })));
    userCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        type: categories.type,
        icon: categories.icon,
      })
      .from(categories)
      .where(or(eq(categories.userId, userId), isNull(categories.userId)));
  }

  // 3. Obtener transacciones recientes
  const recentTransactions = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date))
    .limit(8);

  // 4. Obtener grupos y balances netos
  const userGroupMemberships = await db
    .select({
      groupId: groupMembers.groupId,
      groupName: groups.name,
      baseCurrency: groups.baseCurrency,
      inviteCode: groups.inviteCode,
      netBalance: groupMembers.netBalance,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.userId, userId));

  // Calcular balance total consolidado
  const totalBalance = userWallets.reduce(
    (acc, curr) => acc + parseFloat(curr.currentBalance || "0"),
    0
  );

  // Calcular balance neto compartido (Splitwise)
  const totalSharedBalance = userGroupMemberships.reduce(
    (acc, curr) => acc + parseFloat(curr.netBalance || "0"),
    0
  );

  return (
    <main className="min-h-screen bg-[#090D0B] pb-28 text-zinc-100">
      {/* Header superior */}
      <header className="sticky top-0 z-40 border-b border-[#047857]/20 bg-[#090D0B]/85 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-md shadow-[#047857]/30 border border-[#D4AF37]/50">
              <Image
                src="/logo.png"
                alt="Pari"
                width={34}
                height={34}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
                  Pari <span className="text-[#D4AF37] text-xs">✦</span>
                </span>
                <span className="text-zinc-600 text-xs">•</span>
                <span className="text-xs text-zinc-400 truncate max-w-[130px]">
                  {session.user.name || "Usuario"}
                </span>
              </div>
              <p className="text-[11px] font-medium text-emerald-400/90">Finanzas & Grupos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-bold text-[#D4AF37]">
              {preferredCurrency}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-6 space-y-6">
        {/* Card Principal: Balance Consolidado con degradado Esmeralda & Oro */}
        <section className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#064e3b]/50 via-[#0B1712] to-[#090D0B] p-6 shadow-2xl shadow-[#047857]/15">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                Patrimonio Disponible
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
              {formatCurrency(totalBalance, preferredCurrency)}
            </h1>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#047857]/25 pt-4">
            <div className="space-y-1">
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-[#D4AF37]" /> Balances Compartidos
              </span>
              <p
                className={`text-sm font-bold ${
                  totalSharedBalance >= 0 ? "text-[#D4AF37]" : "text-rose-400"
                }`}
              >
                {totalSharedBalance >= 0 ? "+" : ""}
                {formatCurrency(totalSharedBalance, preferredCurrency)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <Wallet className="h-3.5 w-3.5 text-[#34d399]" /> Cuentas Activas
              </span>
              <p className="text-sm font-semibold text-zinc-200">
                {userWallets.length} {userWallets.length === 1 ? "billetera" : "billeteras"}
              </p>
            </div>
          </div>
        </section>

        {/* Cuentas / Billeteras */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base text-zinc-200 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#D4AF37]" /> Mis Billeteras (Patrimonio)
            </h3>
            <NewWalletModal defaultCurrency={preferredCurrency} />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {userWallets.map((w) => (
              <div
                key={w.id}
                className="min-w-[195px] flex-shrink-0 rounded-2xl border border-[#047857]/30 bg-[#0E1712] p-4 space-y-3 shadow-lg transition-all hover:border-[#D4AF37]/50 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                    {w.type}
                  </span>
                  <div
                    className="h-2.5 w-2.5 rounded-full ring-2 ring-white/10"
                    style={{ backgroundColor: w.color || "#047857" }}
                  />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-zinc-200 truncate">{w.name}</h4>
                  <p className="font-extrabold text-lg text-white mt-0.5">
                    {formatCurrency(w.currentBalance, w.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Grupos estilo Splitwise */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base text-zinc-200 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#D4AF37]" /> Grupos Compartidos
            </h3>
            <NewGroupModal defaultCurrency={preferredCurrency} />
          </div>

          <div className="space-y-2.5">
            {userGroupMemberships.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#047857]/30 p-6 text-center space-y-2 bg-[#0E1712]/50">
                <Users className="mx-auto h-8 w-8 text-zinc-600" />
                <p className="text-sm font-medium text-zinc-300">
                  No tienes grupos de gastos compartidos aún.
                </p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Crea un grupo para tus viajes, departamento o salidas y comparte el código con amigos.
                </p>
              </div>
            ) : (
              userGroupMemberships.map((g) => {
                const bal = parseFloat(g.netBalance || "0");
                return (
                  <div
                    key={g.groupId}
                    className="flex items-center justify-between rounded-2xl border border-[#047857]/30 bg-[#0E1712] p-3.5 transition-all hover:border-[#D4AF37]/50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-zinc-100">{g.groupName}</h4>
                        <span className="rounded-md border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#D4AF37]">
                          {g.inviteCode}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">Moneda base: {g.baseCurrency}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-extrabold ${
                          bal > 0
                            ? "text-[#D4AF37]"
                            : bal < 0
                            ? "text-rose-400"
                            : "text-zinc-400"
                        }`}
                      >
                        {bal > 0
                          ? `Te deben ${formatCurrency(bal, g.baseCurrency)}`
                          : bal < 0
                          ? `Debes ${formatCurrency(Math.abs(bal), g.baseCurrency)}`
                          : "Al día"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Transacciones Recientes */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base text-zinc-200 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-400" /> Movimientos Registrados
            </h3>
            <span className="text-xs text-zinc-500">{recentTransactions.length} recientes</span>
          </div>

          <div className="space-y-2">
            {recentTransactions.length === 0 ? (
              <div className="rounded-2xl border border-[#047857]/20 bg-[#0E1712]/40 p-6 text-center text-sm text-zinc-500">
                Aún no has registrado movimientos. Usa el botón flotante (+) para registrar un gasto o ingreso manual o por voz.
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl border border-[#047857]/20 bg-[#0E1712] p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        tx.type === "income"
                          ? "bg-[#047857]/25 text-[#34d399] border border-[#047857]/40"
                          : tx.type === "expense"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30"
                      }`}
                    >
                      {tx.type === "income" ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : tx.type === "expense" ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <TrendingUp className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        {tx.notes || (tx.type === "expense" ? "Gasto" : "Ingreso")}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(tx.date).toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-sm font-extrabold ${
                      tx.type === "income" ? "text-[#34d399]" : "text-zinc-200"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount, tx.currency)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Floating Action Button (FAB) para Registro Manual y por Voz */}
      <VoiceEntryButton
        wallets={userWallets.map((w) => ({
          id: w.id,
          name: w.name,
          currency: w.currency,
          type: w.type,
          color: w.color,
          isDefault: w.isDefault,
        }))}
        categories={userCategories}
        defaultCurrency={preferredCurrency}
      />
    </main>
  );
}
