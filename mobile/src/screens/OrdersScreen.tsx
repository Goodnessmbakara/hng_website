import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Package, Calendar, Clock, CheckCircle } from 'lucide-react-native';
import { Order } from '../types';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchOrders = useCallback(async () => {
    try {
      let endpoint = '/api/orders';
      if (user?.email) {
        endpoint += `?email=${encodeURIComponent(user.email)}`;
      }
      const res = await apiRequest<{ success: boolean; orders: Order[] }>(endpoint);
      if (res.success && Array.isArray(res.data?.orders)) {
        setOrders(res.data.orders);
      }
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const dateFormatted = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
            <View style={styles.dateRow}>
              <Calendar size={12} color="#94A3B8" />
              <Text style={styles.orderDate}>{dateFormatted}</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <CheckCircle size={12} color="#10B981" />
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.itemsPreview}>
          {item.items.map((it, idx) => (
            <View key={idx} style={styles.itemRow}>
              {it.imageUrl && (
                <Image source={{ uri: it.imageUrl }} style={styles.itemThumbnail} />
              )}
              <Text style={styles.itemName} numberOfLines={1}>
                {it.productName}
              </Text>
              <Text style={styles.itemQuantity}>x{it.quantity}</Text>
              <Text style={styles.itemPrice}>${it.totalPrice.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.totalLabel}>Total Paid:</Text>
          <Text style={styles.totalAmount}>${item.total.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order History</Text>
        <Text style={styles.headerSubtitle}>
          {user ? `Orders for ${user.email}` : 'Recent store purchases'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Fetching orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Package size={52} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No orders placed yet</Text>
          <Text style={styles.emptySubtitle}>
            When you complete checkout on the website or mobile app, your orders will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
          }
        />
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  orderDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  itemsPreview: {
    paddingVertical: 10,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemThumbnail: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#F1F5F9',
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  itemQuantity: {
    fontSize: 11,
    color: '#64748B',
    marginHorizontal: 8,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2563EB',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
});
