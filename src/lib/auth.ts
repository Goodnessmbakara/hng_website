import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { syncUserProfile, getUserProfile, verifyUserCredentials } from './db';

export const isGoogleAuthConfigured = (): boolean => {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-google-client-secret',
    }),
    Credentials({
      id: 'credentials',
      name: 'Account Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const cleanEmail = String(credentials.email).trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) return null;

        const password = credentials.password ? String(credentials.password) : undefined;
        const userName = credentials.name ? String(credentials.name).trim() : cleanEmail.split('@')[0];

        // If password is provided, verify against security hash
        if (password) {
          const authCheck = await verifyUserCredentials(cleanEmail, password);
          if (!authCheck.success || !authCheck.user) {
            throw new Error(authCheck.error || 'Invalid email or password.');
          }

          return {
            id: authCheck.user.id,
            email: authCheck.user.email,
            name: authCheck.user.name || userName,
            image: authCheck.user.image || null,
            emailVerified: authCheck.user.emailVerified ? new Date() : null,
          };
        }

        // Seamless 1-Click / Demo authorization without password
        const existing = await getUserProfile(cleanEmail);
        const userId = existing?.id || `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

        const profile = await syncUserProfile({
          id: userId,
          email: cleanEmail,
          name: existing?.name || userName,
          image: existing?.image || null,
        });

        return {
          id: profile?.id || userId,
          email: cleanEmail,
          name: profile?.name || userName,
          image: profile?.image || null,
          emailVerified: existing?.emailVerified ? new Date() : null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id || token.sub;
        token.emailVerified = (user as any).emailVerified || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = (token?.id || token?.sub || session.user.id) as string;
        (session.user as any).emailVerified = token?.emailVerified || null;
      }
      return session;
    },
    async signIn({ user, account }) {
      try {
        if (user?.email) {
          const cleanEmail = user.email.trim().toLowerCase();
          const existing = await getUserProfile(cleanEmail);
          const userId = existing?.id || user.id || account?.providerAccountId || `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
          const profile = await syncUserProfile({
            id: userId,
            email: cleanEmail,
            name: user.name || cleanEmail.split('@')[0],
            image: user.image || null,
          });
          if (profile) {
            user.id = profile.id;
          }
        }
      } catch (err) {
        console.error('Failed to sync user profile on login:', err);
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'dev-nextauth-secret-change-in-production-123456789',
});

