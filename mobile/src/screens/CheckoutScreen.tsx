import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckCircle2, ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';

export default function CheckoutScreen({ navigation }: any) {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  const freeShippingThreshold = 150;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const shippingFee = isFreeShipping ? 0 : 9.99;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + shippingFee + tax) * 100) / 100;

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('+1 (555) 019-2834');
  const [address, setAddress] = useState('123 Innovation Way, Suite 400');
  const [city, setCity] = useState('San Francisco');
  const [state, setState] = useState('CA');
  const [postalCode, setPostalCode] = useState('94105');
  const [country, setCountry] = useState('United States');

  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<any | null>(null);

  const handlePlaceOrder = async () => {
    if (!fullName.trim() || !email.trim() || !address.trim()) {
      Alert.alert('Missing Details', 'Please provide your full name, email and shipping address.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: items.map((it) => ({
          product: it.product,
          quantity: it.quantity,
        })),
        shippingAddress: {
          fullName,
          email,
          phone,
          address,
          city,
          state,
          postalCode,
          country,
        },
        userId: user?.id || null,
      };

      const res = await apiRequest('/api/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data?.order) {
        setOrderResult(res.data.order);
        await clearCart();
      } else {
        Alert.alert('Checkout Failed', res.error || 'Could not complete your order.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderResult) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.successContainer}>
          <View style={styles.successIconWrapper}>
            <CheckCircle2 size={54} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Order Placed Successfully!</Text>
          <Text style={styles.orderNumberText}>Order #{orderResult.orderNumber}</Text>
          <Text style={styles.successDesc}>
            A confirmation receipt has been sent to {orderResult.customerEmail}. Thank you for shopping with TechHaven!
          </Text>

          <View style={styles.orderSummaryCard}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>Total Paid:</Text>
              <Text style={styles.summaryLineValue}>${orderResult.total.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>Status:</Text>
              <Text style={[styles.summaryLineValue, { color: '#10B981' }]}>
                {orderResult.paymentStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.navigate('Shop')}
          >
            <Text style={styles.doneButtonText}>Back to Store</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Shipping Form */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>

          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Doe"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Street Address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="123 Tech Boulevard"
            style={styles.input}
          />

          <View style={styles.inputRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="San Francisco"
                style={styles.input}
              />
            </View>
            <View style={{ width: 90 }}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                value={state}
                onChangeText={setState}
                placeholder="CA"
                style={styles.input}
              />
            </View>
          </View>
        </View>

        {/* Payment Simulated Card */}
        <View style={styles.sectionCard}>
          <View style={styles.paymentHeader}>
            <CreditCard size={18} color="#2563EB" />
            <Text style={styles.sectionTitle}>Simulated Payment</Text>
          </View>
          <View style={styles.simulatedBox}>
            <ShieldCheck size={16} color="#10B981" />
            <Text style={styles.simulatedText}>
              Test Mode Active &bull; Instant Resend Order Confirmation
            </Text>
          </View>
        </View>

        {/* Order Review */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Summary ({items.length} items)</Text>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryLineLabel}>Subtotal</Text>
            <Text style={styles.summaryLineValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryLineLabel}>Shipping</Text>
            <Text style={styles.summaryLineValue}>
              {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryLineLabel}>Tax (8%)</Text>
            <Text style={styles.summaryLineValue}>${tax.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryLine}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.payButton, submitting && { opacity: 0.7 }]}
          disabled={submitting}
          onPress={handlePlaceOrder}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>Place Order (${total.toFixed(2)})</Text>
          )}
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  inputRow: {
    flexDirection: 'row',
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simulatedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  simulatedText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLineLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryLineValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2563EB',
  },
  payButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIconWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  orderNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 4,
  },
  successDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
    maxWidth: 300,
  },
  orderSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doneButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
