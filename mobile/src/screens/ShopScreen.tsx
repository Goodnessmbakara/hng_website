import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Search, Star, ShoppingBag, Plus, Check, Info, X, AlertTriangle, RefreshCw, Settings } from 'lucide-react-native';
import { Product } from '../types';
import { apiRequest } from '../api/client';
import { getApiUrl } from '../config';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Audio', 'Laptops', 'Wearables', 'Accessories', 'Drones', 'Gaming'];

export default function ShopScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const { addToCart, items } = useCart();
  const { user } = useAuth();

  const fetchProducts = useCallback(async () => {
    try {
      let endpoint = '/api/products';
      const params: string[] = [];
      if (selectedCategory && selectedCategory !== 'All') {
        params.push(`category=${encodeURIComponent(selectedCategory)}`);
      }
      if (searchQuery.trim()) {
        params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      }
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }

      const res = await apiRequest<{ success: boolean; products: Product[]; error?: string }>(endpoint);
      if (res.success && Array.isArray(res.data?.products)) {
        setProducts(res.data.products);
        setFetchError(null);
      } else {
        setFetchError(res.error || 'Failed to fetch catalog from API server');
      }
    } catch (e: any) {
      console.error('Failed to load products:', e);
      setFetchError(e?.message || 'Network connection failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in with your account to add items and sync your cart with the web store.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation?.navigate('Profile') },
        ]
      );
      return;
    }
    await addToCart(product, 1);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId((current) => (current === product.id ? null : current));
    }, 1200);
  };


  const renderProductItem = ({ item }: { item: Product }) => {
    const isAdded = addedProductId === item.id;
    const cartQuantity = items.find((it) => it.product.id === item.id)?.quantity || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => setSelectedProduct(item)}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {item.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          )}
          {cartQuantity > 0 && (
            <View style={styles.inCartIndicator}>
              <Text style={styles.inCartText}>{cartQuantity} in cart</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.ratingRow}>
            <Star size={13} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>
              {item.rating.toFixed(1)} ({item.reviewsCount})
            </Text>
          </View>

          <View style={styles.footerRow}>
            <View>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.priceText}>${item.price.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.addButton, isAdded && styles.addedButton]}
              onPress={() => handleAddToCart(item)}
              activeOpacity={0.7}
            >
              {isAdded ? (
                <Check size={16} color="#FFFFFF" />
              ) : (
                <Plus size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBrand}>
            Tech<Text style={styles.headerBrandAccent}>Haven</Text>
          </Text>
          <Text style={styles.headerSubtitle}>
            {user ? `Hello, ${user.name?.split(' ')[0]}` : 'Discover innovative gear'}
          </Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            placeholder="Search headphones, laptops, accessories..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Product List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading TechHaven catalog...</Text>
        </View>
      ) : fetchError && products.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.errorIconBg}>
            <AlertTriangle size={36} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Cannot Connect to API Server</Text>
          <Text style={styles.errorEndpoint}>
            Target: {getApiUrl()}/api/products
          </Text>
          <Text style={styles.errorDetail}>{fetchError}</Text>
          <Text style={styles.errorHint}>
            Make sure &quot;npm run dev&quot; is running on your Mac and your phone is connected to the same Wi-Fi network.
          </Text>

          <View style={styles.errorActionsRow}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                fetchProducts();
              }}
              activeOpacity={0.8}
            >
              <RefreshCw size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation?.navigate('Profile')}
              activeOpacity={0.8}
            >
              <Settings size={15} color="#2563EB" style={{ marginRight: 6 }} />
              <Text style={styles.settingsButtonText}>Server IP</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centerContainer}>
          <ShoppingBag size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your search or category filter</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563EB']}
            />
          }
        />
      )}

      {/* Product Details Modal */}
      <Modal
        visible={Boolean(selectedProduct)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedProduct(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalCategory}>
                    {selectedProduct.category.toUpperCase()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedProduct(null)}
                    style={styles.closeModalButton}
                  >
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Image
                    source={{ uri: selectedProduct.imageUrl }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />

                  <Text style={styles.modalTitle}>{selectedProduct.name}</Text>

                  <View style={styles.modalRatingRow}>
                    <Star size={16} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.modalRatingText}>
                      {selectedProduct.rating.toFixed(1)} ({selectedProduct.reviewsCount} verified reviews)
                    </Text>
                  </View>

                  <Text style={styles.modalPrice}>${selectedProduct.price.toFixed(2)}</Text>

                  <Text style={styles.sectionHeading}>Description</Text>
                  <Text style={styles.modalDescription}>
                    {selectedProduct.description}
                  </Text>

                  {selectedProduct.features && selectedProduct.features.length > 0 && (
                    <>
                      <Text style={styles.sectionHeading}>Key Features</Text>
                      {selectedProduct.features.map((feat, idx) => (
                        <View key={idx} style={styles.featureRow}>
                          <View style={styles.featureDot} />
                          <Text style={styles.featureText}>{feat}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.modalAddButton}
                    onPress={() => {
                      handleAddToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                  >
                    <ShoppingBag size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.modalAddButtonText}>Add to Synced Cart</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  headerBrand: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerBrandAccent: {
    color: '#2563EB',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  searchWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  categoryPillActive: {
    backgroundColor: '#2563EB',
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 12,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    width: '100%',
    backgroundColor: '#F8FAFC',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  inCartIndicator: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inCartText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  detailsContainer: {
    padding: 10,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 2,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    height: 34,
    lineHeight: 17,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addedButton: {
    backgroundColor: '#10B981',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalCategory: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  closeModalButton: {
    padding: 4,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 24,
  },
  modalRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  modalRatingText: {
    fontSize: 13,
    color: '#64748B',
  },
  modalPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 6,
  },
  modalDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  featureText: {
    fontSize: 13,
    color: '#475569',
  },
  modalFooter: {
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  modalAddButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAddButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  errorEndpoint: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  errorHint: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  errorActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  settingsButtonText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 13,
  },
});

