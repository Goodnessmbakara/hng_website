import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "AeroSound Pro Wireless ANC Headphones",
    description: "Industry-leading active noise cancellation with 40mm custom drivers, spatial audio, and up to 45 hours of battery life on a single charge.",
    price: 299.99,
    rating: 4.9,
    reviewsCount: 342,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    category: "Audio",
    inStock: true,
    stockQuantity: 45,
    badge: "Best Seller",
    features: [
      "Adaptive Active Noise Cancellation",
      "Hi-Res Audio Certified with LDAC",
      "45-hour battery life with quick charge",
      "Multipoint Bluetooth 5.3 connectivity"
    ]
  },
  {
    id: "prod-2",
    name: "UltraBook Pro X14 M3 Chip",
    description: "Ultra-thin aluminum chassis featuring a 14.2-inch Liquid Retina XDR display, 18-hour battery longevity, and powerhouse processing for creators.",
    price: 1499.00,
    rating: 4.9,
    reviewsCount: 189,
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80",
    category: "Computers",
    inStock: true,
    stockQuantity: 18,
    badge: "Top Rated",
    features: [
      "14.2-inch 120Hz ProMotion XDR display",
      "32GB Unified Memory, 1TB NVMe SSD",
      "Thunderbolt 4, MagSafe 3, HDMI 2.1",
      "Precision CNC milled aerospace aluminum"
    ]
  },
  {
    id: "prod-3",
    name: "Apex Mechanical Keyboard 75%",
    description: "Custom pre-lubed linear switches, hot-swappable PCB, wireless tri-mode connectivity, and sound-dampening acoustic silicone gaskets.",
    price: 169.50,
    rating: 4.8,
    reviewsCount: 512,
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
    category: "Peripherals",
    inStock: true,
    stockQuantity: 62,
    badge: "Staff Pick",
    features: [
      "Hot-swappable 5-pin mechanical sockets",
      "Tri-mode: Bluetooth 5.1, 2.4GHz & USB-C",
      "South-facing per-key RGB backlighting",
      "Durable doubleshot PBT keycaps"
    ]
  },
  {
    id: "prod-4",
    name: "Chronos Ultra Smartwatch Gen 4",
    description: "Rugged aerospace titanium casing with sapphire crystal glass, precision dual-frequency GPS, ECG, and continuous blood oxygen tracking.",
    price: 399.00,
    rating: 4.7,
    reviewsCount: 220,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    category: "Wearables",
    inStock: true,
    stockQuantity: 28,
    badge: "New Release",
    features: [
      "Always-On LTPO AMOLED 2000 nits display",
      "Dual-frequency L1 & L5 precision GPS",
      "100m water resistance (WR100)",
      "Up to 7 days battery in smartwatch mode"
    ]
  },
  {
    id: "prod-5",
    name: "Lumina 4K Ultra-Wide Studio Monitor 34\"",
    description: "Curved 34-inch IPS Black panel with 98% DCI-P3 color gamut, 90W USB-C power delivery, and integrated KVM switch for multi-device workflows.",
    price: 799.99,
    rating: 4.8,
    reviewsCount: 147,
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80",
    category: "Displays",
    inStock: true,
    stockQuantity: 14,
    features: [
      "3440 x 1440 WQHD 1900R curvature",
      "90W Power Delivery over USB-C",
      "Delta E < 2 factory color calibration",
      "Built-in 2x 7W stereo speakers & KVM"
    ]
  },
  {
    id: "prod-6",
    name: "SonicPulse Mini Bluetooth Speaker",
    description: "Portable 360° audio with deep bass passive radiators, IP67 dust and waterproof rating, and 24 hours of non-stop playback.",
    price: 89.99,
    rating: 4.6,
    reviewsCount: 405,
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80",
    category: "Audio",
    inStock: true,
    stockQuantity: 80,
    badge: "Popular",
    features: [
      "True 360-degree immersive soundstage",
      "IP67 floatable waterproof design",
      "PartyLink mode connects up to 50 speakers",
      "USB-C reverse charging powerbank"
    ]
  },
  {
    id: "prod-7",
    name: "Precision Ergo Wireless Mouse",
    description: "Sculpted ergonomic silhouette engineered for all-day comfort, 8K DPI Darkfield tracking, quiet click switches, and MagSpeed electromagnetic scroll.",
    price: 109.00,
    rating: 4.9,
    reviewsCount: 890,
    imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80",
    category: "Peripherals",
    inStock: true,
    stockQuantity: 95,
    features: [
      "Tracks on any surface including glass",
      "MagSpeed scroll: 1,000 lines per second",
      "Cross-computer Flow control between Mac & PC",
      "USB-C fast charge: 3 hours use from 1 min"
    ]
  },
  {
    id: "prod-8",
    name: "PowerVolt 3-in-1 MagSafe Charging Dock",
    description: "Fast charge iPhone, Apple Watch, and AirPods simultaneously with official 15W Qi2/MagSafe architecture and premium weighted aluminum base.",
    price: 129.99,
    rating: 4.7,
    reviewsCount: 164,
    imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80",
    category: "Accessories",
    inStock: true,
    stockQuantity: 50,
    features: [
      "Official 15W wireless MagSafe fast charging",
      "Simultaneous charging for phone, watch, buds",
      "Weighted anti-slip base with LED sleep indicator",
      "Braided 2m USB-C cable + 45W GaN adapter included"
    ]
  }
];

export const CATEGORIES = ["All", "Audio", "Computers", "Peripherals", "Wearables", "Displays", "Accessories"];
