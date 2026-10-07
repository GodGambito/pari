import { signIn, signOut } from "@/auth";
import { LogOut } from "lucide-react";

export function GoogleSignInButton({ className }: { className?: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/" });
      }}
      className="w-full"
    >
      <button
        type="submit"
        className={`flex w-full items-center justify-center gap-3 rounded-2xl bg-white border-2 border-[#D4AF37]/50 px-5 py-3.5 text-sm font-bold text-zinc-900 shadow-lg shadow-black/40 transition-all hover:bg-zinc-50 hover:border-[#D4AF37] hover:scale-[1.01] active:scale-[0.98] ${
          className || ""
        }`}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        Continuar con Google
      </button>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:bg-[#047857]/20 hover:text-[#34d399] border border-transparent hover:border-[#047857]/40"
      >
        <LogOut className="h-4 w-4" />
        Cerrar Sesión
      </button>
    </form>
  );
}
