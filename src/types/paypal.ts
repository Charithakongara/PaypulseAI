export interface PayPalProduct {
  id: string; // PayPal Catalog Product ID (e.g. PROD-101)
  sku: string;
  name: string;
  category: string;
  description: string;
  currentPrice: number;
  costPrice: number;
  competitorAvgPrice: number;
  stockLevel: number;
  unitsSold30d: number;
  grossRevenue30d: number;
  refundCount30d: number;
  refundRate: number; // percentage (e.g. 2.1%)
  elasticityScore: number; // e.g. -1.45 (elastic) or -0.6 (inelastic)
  aiRecommendedPrice: number;
  aiRationale: string;
  aiConfidence: number; // 0 to 100%
  salesHistory30d: number[]; // daily units sold over 30 days
  dates30d: string[]; // corresponding dates
  lastUpdated: string;
  paypalSyncStatus: 'synced' | 'pending' | 'updated';
  currency: string;
}

export interface PayPalTransaction {
  transactionId: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string;
  buyerEmail: string;
  buyerName: string;
  amount: number;
  fee: number;
  net: number;
  currency: string;
  status: 'COMPLETED' | 'REFUNDED' | 'PENDING' | 'DENIED';
  timestamp: string;
  paymentMethod: 'PAYPAL_BALANCE' | 'CREDIT_CARD' | 'PAY_IN_4';
}

export interface PayPalDispute {
  disputeId: string;
  transactionId: string;
  amount: number;
  currency: string;
  reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED' | 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED' | 'UNAUTHORISED';
  status: 'UNDER_REVIEW' | 'WAITING_FOR_SELLER' | 'RESOLVED';
  createTime: string;
  buyerNote: string;
}

export interface PayPalInvoice {
  invoiceId: string;
  invoiceNumber: string;
  recipientEmail: string;
  recipientName: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'SENT' | 'DRAFT' | 'OVERDUE';
  dueDate: string;
  invoiceDate: string;
}

export interface MerchantMetrics {
  grossRevenue30d: number;
  netPaymentVolume30d: number;
  totalTransactions30d: number;
  averageOrderValue: number;
  refundRate30d: number;
  totalFees30d: number;
  disputeRate: number;
  unpaidInvoicesTotal: number;
  unpaidInvoicesCount: number;
  projectedMonthEndRevenue: number;
  revenueTarget: number;
  healthScore: number; // 0-100
}

export interface PriceAuditLog {
  id: string;
  sku: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  changeType: 'AI_OPTIMIZATION' | 'MANUAL_EDIT' | 'SIMULATION_APPLY';
  status: 'SUCCESS_PAYPAL_SANDBOX' | 'FAILED' | 'PENDING';
  timestamp: string;
  paypalBatchId?: string;
}

export interface SimulationParams {
  globalPriceDeltaPercent: number; // e.g. +5% or -10%
  skuOverrides: Record<string, number>; // sku -> custom price
}

export interface PayPalCredentials {
  clientId: string;
  clientSecret: string;
  isLiveSandbox: boolean; // true = call real PayPal Sandbox REST API, false = high-fidelity simulated sandbox
  merchantId?: string;
  environment: 'sandbox' | 'demo';
}
