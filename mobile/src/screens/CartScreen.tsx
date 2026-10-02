import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  Lock,
  RefreshCw,
} from 'lucide-react-native';
import { CartItem } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartScreen({ navigation }: any) {
  const {
    items,
    totalItems,
    subtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
    lastSyncedAt,
    refreshCart,
  } = useCart();
  const { user } = useAuth();

  const freeShippingThreshold = 150;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const shippingFee = subtotal > 0 ? (isFreeShipping ? 0 : 9.99) : 0;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + shippingFee + tax) * 100) / 100;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const renderCartItem = ({ item }: { item: CartItem }) => {
    return (
      <View style={styles.itemCard}>
        <Image
          source={{ uri: item.product.imageUrl }}
          style={styles.itemImage}
          resizeMode="cover"
        />

        <View style={styles.itemDetails}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.product.name}
            </Text>
            <TouchableOpacity
              onPress={() => removeFromCart(item.product.id)}
              style={styles.deleteButton}
            >
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <Text style={styles.itemCategory}>{item.product.category}</Text>

          <View style={styles.itemFooter}>
            <Text style={styles.itemPrice}>
              ${(item.product.price * item.quantity).toFixed(2)}
            </Text>

            {/* Quantity Stepper */}
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                style={styles.stepButton}
              >
                <Minus size={13} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.stepQuantity}>{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                style={styles.stepButton}
              >
                <Plus size={13} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <View style={styles.syncStatusRow}>
            <View style={styles.syncDot} />
            <Text style={styles.syncStatusText}>
              {user
                ? `Live Synced with Web Store (${user.email})`
                : 'Not signed in — log in to sync'}
            </Text>
          </View>
        </View>

        {items.length > 0 && (
          <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Free Shipping Progress Indicator */}
      {subtotal > 0 && (
        <View style={styles.progressCard}>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressText}>
              {isFreeShipping
                ? '🎉 Free express shipping unlocked!'
                : `Add $${(freeShippingThreshold - subtotal).toFixed(2)} for Free Shipping`}
            </Text>
            <Text style={styles.progressPercentText}>{Math.round(progressPercent)}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Not Logged In Notice Banner */}
      {!user && (
        <TouchableOpacity
          style={styles.authNoticeBanner}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <Lock size={16} color="#2563EB" style={{ marginRight: 8 }} />
          <Text style={styles.authNoticeText}>
            Sign in with Google to sync your cart instantly with the web!
          </Text>
        </TouchableOpacity>
      )}

      {/* Cart Items List */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <ShoppingBag size={48} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            When you add an item on the website, it will instantly appear right here on your phone!
          </Text>
          <TouchableOpacity
            style={styles.shopNowButton}
            onPress={() => navigation.navigate('Shop')}
          >
            <Text style={styles.shopNowText}>Explore Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.product.id}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Checkout Bottom Sheet */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({totalItems} items)</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>
                {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Tax</Text>
              <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryTotalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Checkout')}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
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
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  syncStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  clearText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#BFDBFE',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
  },
  authNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  authNoticeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itemImage: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  deleteButton: {
    padding: 4,
  },
  itemCategory: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  stepQuantity: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    minWidth: 20,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    maxWidth: 280,
  },
  shopNowButton: {
    marginTop: 20,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  shopNowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563EB',
  },
  checkoutButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
