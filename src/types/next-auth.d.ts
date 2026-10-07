import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      preferredCurrency: string;
    } & DefaultSession["user"];
  }

  interface User {
    preferredCurrency?: string;
  }
}
