import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      state?: string;
      walletAddress?: string;
      roles?: string[];
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    state?: string;
    walletAddress?: string;
    roles?: string[];
  }
}
