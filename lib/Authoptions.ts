import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import publicFetch from "@/lib/Publicfetch";
import rotateAccessToken from "@/lib/Rotateaccesstoken";
import { jwtDecode } from "jwt-decode";
import { AccessClaims } from "@/types/auth";

// TODO: import GoogleProvider when adding Google OAuth support
// import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },

      //@ts-expect-error — NextAuth expects authorize() to return User | null,
      // but we return a custom shape with accessToken/refreshToken.
      // The session and jwt callbacks handle the mapping downstream.
      async authorize(credentials) {
        const { data, error } = await publicFetch("token/", {
          method: "POST",
          // Pass credentials as a plain object — publicFetch handles JSON.stringify internally.
          // credentials contains { identifier, password } which matches CustomJWTSerializer's
          // expected payload (identifier instead of email, as per the backend serializer).
          body: credentials,
        });

        if (data) {
          return {
            accessToken: data.access,
            refreshToken: data.refresh,
          };
        }

        if (error) {
          console.error("Login failed:", error.message);
          return null;
        }
      },
    }),

    // TODO: add GoogleProvider when adding Google OAuth support.
    // Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.
    // The backend will also need a social auth endpoint (e.g. "auth/google/")
    // that accepts the Google id_token and returns your own access/refresh tokens.
    //
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // On initial login — decode the access token and attach claims to the session.
      // TODO: when adding Google OAuth, split this branch by provider since OAuth
      // providers return their own tokens, not your backend's JWT tokens.
      if (account && user) {
        // --- Credentials provider ---
        if (account.provider === "credentials") {
          try {
            const decoded = user?.accessToken
              ? jwtDecode<AccessClaims>(user.accessToken)
              : undefined;

            token.accessToken = user.accessToken;
            token.refreshToken = user.refreshToken;
            // exp is in seconds — convert to milliseconds for Date.now() comparisons
            token.accessTokenExpires = decoded?.exp
              ? decoded.exp * 1000
              : undefined;
            token.accessClaims = decoded;

            return { ...token, ...user };
          } catch (error) {
            // If decoding fails on initial login, do not return a partial token
            console.error("Failed to decode access token on login:", error);
            return null;
          }
        }

        // TODO: Google OAuth provider — uncomment and implement when integrating Google.
        // The recommended approach is to exchange the Google id_token with your backend
        // for your own access/refresh tokens, keeping the session shape consistent.
        //
        // if (account.provider === "google") {
        //   // Exchange Google's id_token with your backend for your own JWT tokens.
        //   // Your backend verifies the Google token and returns { access, refresh }.
        //   const { data, error } = await publicFetch("auth/google/", {
        //     method: "POST",
        //     body: { id_token: account.id_token },
        //   });
        //
        //   if (error || !data) {
        //     console.error("Google token exchange failed:", error?.message);
        //     return null;
        //   }
        //
        //   const decoded = jwtDecode<AccessClaims>(data.access);
        //   token.accessToken = data.access;
        //   token.refreshToken = data.refresh;
        //   token.accessTokenExpires = decoded?.exp ? decoded.exp * 1000 : undefined;
        //   token.accessClaims = decoded;
        //
        //   return { ...token, ...user };
        // }
      }

      // Manual refresh — triggered when useSession().update() is called client-side
      // (e.g. after authFetch detects a 401 and calls refreshSession())
      if (trigger === "update") {
        try {
          console.log("Manual refresh triggered via useSession().update()");
          const refreshed = await rotateAccessToken(token);
          return { ...token, ...refreshed, error: undefined };
        } catch (error) {
          console.error("Manual refresh failed:", error);
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }

      // Token still valid — return as-is without hitting the backend
      // @ts-expect-error — accessTokenExpires is a custom field not in NextAuth's JWT type
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Token expired — attempt automatic refresh before the next request
      try {
        console.log("Access token expired. Attempting automatic refresh...");
        const refreshed = await rotateAccessToken(token);
        return { ...token, ...refreshed, error: undefined };
      } catch (error) {
        console.error("Automatic refresh failed:", error);
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },

    async session({ session, token }) {
      // Expose token fields to the client-side session object.
      // accessToken is needed by fetch utilities to authorize requests.
      session.accessClaims = token?.accessClaims;
      session.accessToken = token?.accessToken;
      // Surfaces refresh errors so fetch utilities can trigger sign-out
      session.error = token?.error;
      return session;
    },
  },
};
