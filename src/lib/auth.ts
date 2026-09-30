import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { syncUserProfile } from './db';

export const isGoogleAuthConfigured = (): boolean => {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-google-client-secret',
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        await syncUserProfile({
          id: user.id || account?.providerAccountId,
          email: user.email,
          name: user.name,
          image: user.image,
        });
      } catch (err) {
        console.error('Failed to sync user profile on login:', err);
      }
      return true;
    },
    session({ session, token }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'dev-nextauth-secret-change-in-production-123456789',
});
