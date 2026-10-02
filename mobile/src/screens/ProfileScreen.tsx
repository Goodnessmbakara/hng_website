import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  User,
  LogOut,
  Server,
  Mail,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getApiUrl, setApiUrl, DEFAULT_API_URL } from '../config';

export default function ProfileScreen() {
  const { user, loginWithGoogle, loginWithAccount, logout, isLoading } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [serverUrlInput, setServerUrlInput] = useState(getApiUrl());
  const [savingServer, setSavingServer] = useState(false);

  const handleGoogleSignIn = async () => {
    const res = await loginWithGoogle();
    if (!res.success && res.error) {
      Alert.alert('Google Sign-In', res.error);
    }
  };

  const handleAccountSignIn = async (emailToUse?: string, nameToUse?: string) => {
    const targetEmail = emailToUse || emailInput;
    const targetName = nameToUse || nameInput;

    if (!targetEmail.trim()) {
      Alert.alert('Email Required', 'Please enter your account email to sign in.');
      return;
    }

    const res = await loginWithAccount(targetEmail, targetName);
    if (!res.success) {
      Alert.alert('Sign-In Failed', res.error || 'Could not verify account.');
    } else {
      setEmailInput('');
      setNameInput('');
    }
  };

  const handleSaveServerUrl = async () => {
    setSavingServer(true);
    await setApiUrl(serverUrlInput);
    setSavingServer(false);
    Alert.alert('Server URL Updated', `API requests will now connect to:\n${getApiUrl()}`);
  };

  const handleResetServerUrl = async () => {
    setServerUrlInput(DEFAULT_API_URL);
    await setApiUrl(DEFAULT_API_URL);
    Alert.alert('Reset Complete', `Reset to default:\n${DEFAULT_API_URL}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account & Settings</Text>
        <Text style={styles.headerSubtitle}>Synchronized with your TechHaven web store</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        {user ? (
          <View style={styles.card}>
            <View style={styles.profileHeader}>
              {user.image ? (
                <Image source={{ uri: user.image }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user.name || 'TechHaven Customer'}</Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
                <View style={styles.accountBadge}>
                  <ShieldCheck size={12} color="#10B981" />
                  <Text style={styles.accountBadgeText}>Same Account Active</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <LogOut size={16} color="#EF4444" />
              <Text style={styles.logoutText}>Sign Out from Mobile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In with Your Account</Text>
            <Text style={styles.cardSubtitle}>
              Sign in with the same account you use on the website to instantly share your cart and orders across devices.
            </Text>

            {/* Google Sign In Button */}
            <TouchableOpacity
              style={styles.googleButton}
              activeOpacity={0.8}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Text style={styles.googleIconText}>G</Text>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.orDividerRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR EMAIL SIGN IN</Text>
              <View style={styles.orLine} />
            </View>

            {/* Direct Account Email Form */}
            <Text style={styles.inputLabel}>Full Name (Optional)</Text>
            <TextInput
              placeholder="e.g. John Doe"
              value={nameInput}
              onChangeText={setNameInput}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Account Email</Text>
            <TextInput
              placeholder="e.g. your-email@gmail.com"
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.emailSignInButton}
              onPress={() => handleAccountSignIn()}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.emailSignInButtonText}>Sign In to Account</Text>
              )}
            </TouchableOpacity>

            {/* Quick 1-Tap Demo Account for immediate phone testing */}
            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>Quick 1-Tap Test Accounts:</Text>
              <View style={styles.demoButtonsRow}>
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => handleAccountSignIn('demo.shopper@techhaven.com', 'Demo Shopper')}
                >
                  <Text style={styles.demoChipText}>Demo Shopper</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => handleAccountSignIn('alice.tech@gmail.com', 'Alice Tech')}
                >
                  <Text style={styles.demoChipText}>Alice Tech</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Server Endpoint Configuration Card */}
        <View style={styles.card}>
          <View style={styles.serverCardHeader}>
            <Server size={18} color="#2563EB" />
            <Text style={styles.cardTitle}>Backend Server Connection</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Your phone must be able to reach your Next.js server. If on the same Wi-Fi, use your Mac IP (e.g. 192.168.1.111:3000), or enter an ngrok/Vercel URL.
          </Text>

          <TextInput
            value={serverUrlInput}
            onChangeText={setServerUrlInput}
            placeholder="http://192.168.1.111:3000"
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { fontFamily: 'monospace' }]}
          />

          <View style={styles.serverActionsRow}>
            <TouchableOpacity
              style={styles.saveServerButton}
              onPress={handleSaveServerUrl}
              disabled={savingServer}
            >
              <Text style={styles.saveServerButtonText}>
                {savingServer ? 'Saving...' : 'Apply Server URL'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetServerButton}
              onPress={handleResetServerUrl}
            >
              <Text style={styles.resetServerButtonText}>Reset Default</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  accountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    gap: 6,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleIconText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4285F4',
    marginRight: 8,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
  },
  emailSignInButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  emailSignInButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  demoBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  serverCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serverActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  saveServerButton: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveServerButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  resetServerButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resetServerButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
});
