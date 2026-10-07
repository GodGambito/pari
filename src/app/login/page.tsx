import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth-buttons";
import { Wallet, Users, Mic, TrendingUp } from "lucide-react";
import Image from "next/image";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#090D0B] px-4 py-12 text-zinc-100">
      <div className="w-full max-w-md space-y-8">
        {/* Branding con el Logo Oficial */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white p-3 shadow-2xl shadow-[#047857]/30 border-2 border-[#D4AF37]/50 transition-transform hover:scale-105">
            <Image
              src="/logo.png"
              alt="Pari Logo"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
              Pari <span className="text-[#D4AF37]">✦</span>
            </h1>
            <p className="text-xs font-medium text-emerald-400 mt-1 uppercase tracking-wider">
              Finanzas Personales & Gastos Compartidos
            </p>
          </div>
          <p className="text-sm text-zinc-400 max-w-xs mx-auto">
            La plataforma inteligente para tomar el control de tu patrimonio y dividir gastos sin fricción.
          </p>
        </div>

        {/* Card de Inicio de Sesión */}
        <div className="rounded-3xl border border-[#047857]/40 bg-[#0E1712]/90 p-6 backdrop-blur-2xl shadow-2xl shadow-black/80 space-y-6">
          <div className="space-y-3.5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#047857]/20 border border-[#047857]/40 text-[#34d399]">
                <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">Patrimonio & Multimoneda</h4>
                <p className="text-xs text-zinc-400">
                  Control de cuentas, tarjetas y tipos de cambio congelados en el tiempo.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]">
                <Users className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">Grupos estilo Splitwise</h4>
                <p className="text-xs text-zinc-400">
                  División inteligente con simplificación matemática de deudas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#047857]/20 border border-[#047857]/40 text-[#34d399]">
                <Mic className="h-5 w-5 text-[#34d399]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">Entrada Rápida por Voz (NLP)</h4>
                <p className="text-xs text-zinc-400">
                  Dicta tus movimientos diarios y Pari inferirá montos y categorías.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#047857]/30">
            <GoogleSignInButton />
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500">
          Protegido con autenticación de grado bancario y base de datos distribuida en Neon.
        </p>
      </div>
    </div>
  );
}
