import type {
  User,
  Customer,
  Product,
  Category,
  Tag,
  Quote,
  QuoteItem,
  Sale,
  SaleItem,
  StockMovement,
  FreightZone,
  PendingOrder,
  Settings,
  CustomerType,
  PaymentMethod,
  QuoteStatus,
  StockMovementType,
  PendingOrderStatus,
  UserRole,
} from "@prisma/client";

export type {
  User,
  Customer,
  Product,
  Category,
  Tag,
  Quote,
  QuoteItem,
  Sale,
  SaleItem,
  StockMovement,
  FreightZone,
  PendingOrder,
  Settings,
  CustomerType,
  PaymentMethod,
  QuoteStatus,
  StockMovementType,
  PendingOrderStatus,
  UserRole,
};

export type CustomerWithStats = Customer & {
  _count: { quotes: number; sales: number };
  totalSpent?: number;
};

export type ProductWithCategory = Product & {
  category: Category | null;
  productTags: { tag: Tag }[];
};

export type QuoteWithDetails = Quote & {
  customer: Customer;
  freightZone: FreightZone | null;
  items: (QuoteItem & { product: Product })[];
};

export type SaleWithDetails = Sale & {
  customer: Customer;
  quote: Quote;
  items: (SaleItem & { product: Product })[];
};

export type PendingOrderWithDetails = PendingOrder & {
  customer: Customer;
  product: Product;
};

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
