import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  wallets,
  categories,
} from "@/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Alimentación y Supermercado", icon: "ShoppingCart", color: "#F59E0B" },
  { name: "Restaurantes y Cafeterías", icon: "Utensils", color: "#EF4444" },
  { name: "Transporte y Combustible", icon: "Car", color: "#3B82F6" },
  { name: "Vivienda y Servicios", icon: "Home", color: "#6366F1" },
  { name: "Salud y Bienestar", icon: "HeartPulse", color: "#EC4899" },
  { name: "Ocio y Suscripciones", icon: "Film", color: "#8B5CF6" },
  { name: "Otros Gastos", icon: "MoreHorizontal", color: "#6B7280" },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salario / Sueldo", icon: "Briefcase", color: "#10B981" },
  { name: "Inversiones y Dividendos", icon: "TrendingUp", color: "#059669" },
  { name: "Ingresos Extra / Freelance", icon: "PlusCircle", color: "#14B8A6" },
  { name: "Regalos y Devoluciones", icon: "Gift", color: "#84CC16" },
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        // Obtenemos moneda preferida del usuario en la base de datos
        const [dbUser] = await db
          .select({ preferredCurrency: users.preferredCurrency })
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);

        session.user.preferredCurrency = dbUser?.preferredCurrency || "CLP";
      }
      return session;
    },
  },
  events: {
    // Se ejecuta de forma atómica en el primer inicio de sesión del usuario
    async createUser({ user }) {
      if (!user.id) return;
      const currency = user.preferredCurrency || "CLP";

      try {
        // 1. Crear Billetera Principal por defecto
        await db.insert(wallets).values({
          userId: user.id,
          name: "Efectivo / Cuenta Principal",
          type: "cash",
          currency: currency,
          initialBalance: "0.00",
          currentBalance: "0.00",
          color: "#10B981",
          icon: "Wallet",
          isDefault: true,
        });

        // 2. Sembrar categorías iniciales de gastos
        const expenseCategoriesData = DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
          userId: user.id,
          name: cat.name,
          type: "expense" as const,
          icon: cat.icon,
          color: cat.color,
          isDefault: true,
        }));

        // 3. Sembrar categorías iniciales de ingresos
        const incomeCategoriesData = DEFAULT_INCOME_CATEGORIES.map((cat) => ({
          userId: user.id,
          name: cat.name,
          type: "income" as const,
          icon: cat.icon,
          color: cat.color,
          isDefault: true,
        }));

        await db.insert(categories).values([
          ...expenseCategoriesData,
          ...incomeCategoriesData,
        ]);

        console.info(`[Auth] Seed inicial completado con éxito para el usuario ${user.id}`);
      } catch (error) {
        console.error(`[Auth Error] Fallo al sembrar datos iniciales:`, error);
      }
    },
  },
});
