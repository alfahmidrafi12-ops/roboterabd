export type SortOption = 'featured' | 'popular' | 'price-asc' | 'price-desc' | 'newest';

export type AvailabilityFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';

export type CategoryId = string;

export type ArtworkKind =
  | 'esp32'
  | 'arduino'
  | 'raspberry-pi'
  | 'stm32'
  | 'lidar'
  | 'ultrasonic'
  | 'imu'
  | 'servo'
  | 'stepper'
  | 'brushless'
  | 'driver'
  | 'arm'
  | 'rover'
  | 'lipo'
  | 'bms'
  | 'buck'
  | 'oled'
  | 'lora'
  | 'soldering'
  | 'analyzer';

export type BannerTheme = 'navy' | 'cobalt' | 'slate' | 'emerald';

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface CategoryItem {
  id: string;
  name: string;
  countLabel: string;
  artwork: ArtworkKind;
  imageUrl?: string;
  order?: number;
  active?: boolean;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  categoryLabel: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  stock: number;
  tag?: string;
  isBestSeller?: boolean;
  isJustArrived?: boolean;
  artwork: ArtworkKind;
  imageUrl?: string;
  videoUrl?: string;
  shortDesc: string;
  specs: ProductSpec[];
  variants?: string[];
}

export interface BannerItem {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  targetCategory: CategoryId;
  linkUrl?: string;
  theme: BannerTheme;
  artwork: ArtworkKind;
  imageUrl?: string;
  order: number;
  active: boolean;
}

export interface SiteImagesConfig {
  id: string;
  heroImageUrl: string;
  heroKicker?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroTagline?: string;
  heroDispatchText?: string;
  promoLeftImageUrl?: string;
  promoTopRightImageUrl?: string;
  promoBottomRightImageUrl?: string;
  discountBannerImageUrl?: string;
  blogImages?: Record<string, string>;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: string;
}

export interface OrderLineItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
}

export interface StoredOrder {
  orderId: string;
  userId?: string;
  customerName: string;
  phone: string;
  address: string;
  district: string;
  paymentMethod: string;
  status: OrderStatus;
  items: OrderLineItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode?: string;
  notes?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface OrderTrackingInfo {
  orderId: string;
  status: OrderStatus;
  district: string;
  paymentMethod: string;
  itemCount: number;
  total: number;
  courierNote?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  excerpt: string;
  artwork: ArtworkKind;
  content: string[];
}

export interface OrderReceipt {
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  district: string;
  paymentMethod: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
}

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  email: string;
  userId?: string;
  baselinePrice: number;
  notifiedPrice?: number;
  status: 'Active' | 'Notified';
  createdAt: unknown;
  updatedAt: unknown;
}

export interface LocalPriceWatch {
  productId: string;
  productName: string;
  email: string;
  baselinePrice: number;
}
