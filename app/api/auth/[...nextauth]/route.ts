import NextAuth from "next-auth";
import { authOptions } from "@/lib/Authoptions"; // adjust path to wherever authOptions lives

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
