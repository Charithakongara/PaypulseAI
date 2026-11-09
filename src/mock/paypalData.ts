import { PayPalProduct, PayPalTransaction, PayPalDispute, PayPalInvoice, MerchantMetrics, PriceAuditLog } from '../types/paypal';

// Generate 30 days of dates ending today (November 9, 2026)
const generateDates30d = (): string[] => {
  const dates: string[] = [];
  const base = new Date('2026-11-09T08:00:00Z');
  for (let i = 29; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

export const DATES_30D = generateDates30d();

export const INITIAL_PRODUCTS: PayPalProduct[] = [
  {
    id: 'PROD-101-WLH',
    sku: 'SKU-101',
    name: 'AcousticPro ANC Wireless Headphones',
    category: 'AUDIO_ACCESSORIES',
    description: 'Flagship hybrid noise-cancelling over-ear headphones with 40h battery life.',
    currentPrice: 249.99,
    costPrice: 95.00,
    competitorAvgPrice: 269.99,
    stockLevel: 142,
    unitsSold30d: 384,
    grossRevenue30d: 95996.16,
    refundCount30d: 6,
    refundRate: 1.56,
    elasticityScore: -0.82, // Inelastic: high brand loyalty, room to increase price
    aiRecommendedPrice: 264.99,
    aiRationale: 'Inelastic demand curve (E = -0.82). Competitors average $269.99. Raising price by +6% will capture an estimated +$4,900 in gross margin with minimal drop in volume.',
    aiConfidence: 94,
    salesHistory30d: [12, 14, 11, 15, 13, 10, 16, 18, 14, 12, 11, 13, 15, 14, 12, 13, 11, 14, 17, 13, 12, 15, 11, 14, 16, 13, 12, 15, 14, 13],
    dates30d: DATES_30D,
    lastUpdated: '2026-11-08T14:22:00Z',
    paypalSyncStatus: 'synced',
    currency: 'USD'
  },
  {
    id: 'PROD-102-MKB',
    sku: 'SKU-102',
    name: 'ErgoMech RGB Wireless Mechanical Keyboard',
    category: 'COMPUTER_PERIPHERALS',
    description: 'Hot-swappable low-profile mechanical keyboard with gasket mount.',
    currentPrice: 159.00,
    costPrice: 62.00,
    competitorAvgPrice: 145.00,
    stockLevel: 48,
    unitsSold30d: 215,
    grossRevenue30d: 34185.00,
    refundCount30d: 4,
    refundRate: 1.86,
    elasticityScore: -1.35, // Unitary/elastic
    aiRecommendedPrice: 149.99,
    aiRationale: 'Priced above market average ($145). Aligning price to $149.99 matches conversion sweet spot and stimulates turnover for aging inventory batch.',
    aiConfidence: 89,
    salesHistory30d: [8, 7, 9, 6, 8, 5, 10, 9, 7, 6, 8, 7, 5, 9, 8, 6, 7, 8, 9, 6, 7, 8, 6, 7, 9, 7, 8, 6, 7, 8],
    dates30d: DATES_30D,
    lastUpdated: '2026-11-07T18:10:00Z',
    paypalSyncStatus: 'synced',
    currency: 'USD'
  },
  {
    id: 'PROD-103-USC',
    sku: 'SKU-103',
    name: 'HyperCharge 140W GaN Desktop Charger Hub',
    category: 'POWER_AND_CABLES',
    description: '4-port USB-C PD 3.1 fast charger with smart power allocation display.',
    currentPrice: 89.99,
    costPrice: 28.50,
    competitorAvgPrice: 79.99,
    stockLevel: 310,
    unitsSold30d: 540,
    grossRevenue30d: 48594.60,
    refundCount30d: 3,
    refundRate: 0.55,
    elasticityScore: -1.88, // Highly elastic
    aiRecommendedPrice: 79.99,
    aiRationale: 'High price elasticity (E = -1.88). Lowering price to $79.99 will unlock high-velocity search placement, projected to boost monthly sales by +24%.',
    aiConfidence: 96,
    salesHistory30d: [16, 18, 17, 19, 15, 22, 20, 18, 17, 19, 21, 16, 17, 20, 18, 17, 19, 22, 16, 18, 20, 17, 19, 18, 21, 17, 18, 19, 20, 18],
    dates30d: DATES_30D,
    lastUpdated: '2026-11-09T02:00:00Z',
    paypalSyncStatus: 'synced',
    currency: 'USD'
  },
  {
    id: 'PROD-104-MNT',
    sku: 'SKU-104',
    name: 'UltraVision 27" 4K HDR USB-C Creator Monitor',
    category: 'DISPLAYS',
    description: 'Calibrated IPS panel with 99% DCI-P3, 90W power delivery, and KVM switch.',
    currentPrice: 429.00,
    costPrice: 240.00,
    competitorAvgPrice: 449.00,
    stockLevel: 24, // low stock
    unitsSold30d: 88,
    grossRevenue30d: 37752.00,
    refundCount30d: 5,
    refundRate: 5.68, // elevated refund rate
    elasticityScore: -0.65, // Inelastic
    aiRecommendedPrice: 449.00,
    aiRationale: 'Inventory is critically low (24 units left). Competitors sell at $449. Raising price protects stock out and preserves profit margin while fresh shipment is in transit.',
    aiConfidence: 91,
    salesHistory30d: [3, 4, 2, 3, 4, 2, 5, 3, 2, 3, 4, 3, 2, 4, 3, 2, 3, 4, 2, 3, 4, 2, 3, 4, 3, 2, 3, 4, 2, 3],
    dates30d: DATES_30D,
    lastUpdated: '2026-11-06T11:45:00Z',
    paypalSyncStatus: 'synced',
    currency: 'USD'
  },
  {
    id: 'PROD-105-DMT',
    sku: 'SKU-105',
    name: 'BioDesk Dual-Motor Standing Desk Frame',
    category: 'FURNITURE',
    description: 'Heavy-duty steel motorized frame with 4 programmable height presets.',
    currentPrice: 319.00,
    costPrice: 135.00,
    competitorAvgPrice: 329.00,
    stockLevel: 82,
    unitsSold30d: 142,
    grossRevenue30d: 45298.00,
    refundCount30d: 2,
    refundRate: 1.41,
    elasticityScore: -1.15,
    aiRecommendedPrice: 324.99,
    aiRationale: 'Moderate elasticity. Healthy velocity. Gentle price test to $324.99 captures extra $850 net revenue without harming conversion rate.',
    aiConfidence: 87,
    salesHistory30d: [4, 5, 6, 3, 5, 4, 6, 5, 4, 6, 5, 4, 5, 6, 4, 5, 4, 6, 5, 4, 6, 5, 4, 5, 6, 4, 5, 4, 6, 4],
    dates30d: DATES_30D,
    lastUpdated: '2026-11-08T09:12:00Z',
    paypalSyncStatus: 'synced',
    currency: 'USD'
  },
  {
    id: 'PROD-106-WCM',
    sku: 'SKU-106',
    name: 'StreamCam 4K Studio Webcam & Ring Light',
    category: 'STREAMING_VIDEO',
    description: 'Sony STARVIS sensor with dual AI noise cancelling beamforming mics.',
    currentPrice: 129.99,
    costPrice: 44.00,
    competitorAvgPrice: 119.99,
    stockLevel: 195,
    unitsSold30d: 310,
    grossRevenue30d: 40296.90,
    refundCount30d: 7,
    refundRate: 2.26,
    elasticityScore: -1.72,
    aiRecommendedPrice: 119.99,
    aiRationale: 'Competitors are discounting to $119.99. Lowering price matches the competitive baseline and prevents basket abandonment.',
    aiConfidence: 93,
    salesHistory30d: [11, 10, 12, 9, 13, 10, 11, 12, 9, 10, 12, 11, 10, 12, 9, 11, 10, 12, 10, 11, 9, 12, 10, 11, 12, 10, 11, 9, 12, 10],
    dates30d: DATES_30D,
    lastUpdated: '2026-11-05T16:30:00Z',
    paypalSyncStatus: 'synced',
    currency: 'USD'
  },
  {
    id: 'PROD-107-ERM',
    sku: 'SKU-107',
    name: 'PrecisionFit Ergonomic Vertical Mouse',
    category: 'COMPUTER_PERIPHERALS',
    description: 'Natural 57-degree handshake grip with dual Bluetooth & 2.4GHz connectivity.',
    currentPrice: 69.99,
    costPrice: 21.00,
    competitorAvgPrice: 74.99,
    stockLevel: 230,
    unitsSold30d: 460,
    grossRevenue30d: 32195.40,
    refundCount30d: 4,
    refundRate: 0.87,
    elasticityScore: -0.95,
    aiRecommendedPrice: 72.99,
    aiRationale: 'Very low refund rate (0.87%) and loyal reviews. Incrementally adjust to $72.99 to increase gross margin from 70.0% to 71.2%.',
    aiConfidence: 92,
    salesHistory30d: [14, 16, 15, 17, 13, 16, 18, 14, 15, 17, 14, 16, 15, 14, 17, 15, 16, 14, 17, 15, 16, 14, 17, 15, 16, 14, 17, 15, 16, 15],
    dates30d: DATES_30D,
    lastUpdated: '2026-11-09T01:15:00Z',
    paypalSyncStatus: 'synced',
    currency: 'USD'
  },
  {
    id: 'PROD-108-LPD',
    sku: 'SKU-108',
    name: 'Zenith Merino Wool & Leather Desk Mat',
    category: 'OFFICE_ACCESSORIES',
    description: 'Anti-slip natural cork base with water-resistant vegan saddle leather trim.',
    currentPrice: 44.99,
    costPrice: 12.00,
    competitorAvgPrice: 39.99,
    stockLevel: 175,
    unitsSold30d: 280,
    grossRevenue30d: 12597.20,
    refundCount30d: 2,
    refundRate: 0.71,
    elasticityScore: -1.60,
    aiRecommendedPrice: 39.99,
    aiRationale: 'Elastic demand. Lowering to $39.99 crosses psychological $40 threshold, historically increasing basket attachment rate by 31%.',
    aiConfidence: 90,
    salesHistory30d: [9, 8, 10, 9, 11, 8, 10, 9, 8, 10, 9, 8, 11, 9, 10, 8, 9, 10, 8, 9, 11, 8, 10, 9, 8, 10, 9, 8, 10, 9],
    dates30d: DATES_30D,
    lastUpdated: '2026-11-08T20:45:00Z',
    paypalSyncStatus: 'synced',
    currency: 'USD'
  }
];

export const INITIAL_TRANSACTIONS: PayPalTransaction[] = [
  {
    transactionId: '9XY827361AA98210Z',
    orderId: 'ORD-2026-88192',
    productId: 'PROD-101-WLH',
    productName: 'AcousticPro ANC Wireless Headphones',
    sku: 'SKU-101',
    buyerEmail: 's.miller@acmecorp.com',
    buyerName: 'Sarah Miller',
    amount: 249.99,
    fee: 7.55,
    net: 242.44,
    currency: 'USD',
    status: 'COMPLETED',
    timestamp: '2026-11-09T07:45:12Z',
    paymentMethod: 'PAYPAL_BALANCE'
  },
  {
    transactionId: '5TR192837BB38472Y',
    orderId: 'ORD-2026-88191',
    productId: 'PROD-103-USC',
    productName: 'HyperCharge 140W GaN Desktop Charger Hub',
    sku: 'SKU-103',
    buyerEmail: 'd.chen@apextechnologies.io',
    buyerName: 'David Chen',
    amount: 89.99,
    fee: 2.91,
    net: 87.08,
    currency: 'USD',
    status: 'COMPLETED',
    timestamp: '2026-11-09T06:30:40Z',
    paymentMethod: 'CREDIT_CARD'
  },
  {
    transactionId: '8KJ372819CC47281X',
    orderId: 'ORD-2026-88190',
    productId: 'PROD-104-MNT',
    productName: 'UltraVision 27" 4K HDR USB-C Creator Monitor',
    sku: 'SKU-104',
    buyerEmail: 'marcus.vance@designgrid.co',
    buyerName: 'Marcus Vance',
    amount: 429.00,
    fee: 12.74,
    net: 416.26,
    currency: 'USD',
    status: 'COMPLETED',
    timestamp: '2026-11-09T05:12:18Z',
    paymentMethod: 'PAY_IN_4'
  },
  {
    transactionId: '4LK829103DD92837W',
    orderId: 'ORD-2026-88189',
    productId: 'PROD-107-ERM',
    productName: 'PrecisionFit Ergonomic Vertical Mouse',
    sku: 'SKU-107',
    buyerEmail: 'elena.rostova@synapse.ai',
    buyerName: 'Elena Rostova',
    amount: 69.99,
    fee: 2.33,
    net: 67.66,
    currency: 'USD',
    status: 'COMPLETED',
    timestamp: '2026-11-09T04:05:00Z',
    paymentMethod: 'PAYPAL_BALANCE'
  },
  {
    transactionId: '1MN392018EE83726V',
    orderId: 'ORD-2026-88188',
    productId: 'PROD-104-MNT',
    productName: 'UltraVision 27" 4K HDR USB-C Creator Monitor',
    sku: 'SKU-104',
    buyerEmail: 'j.holloway@cloudbase.net',
    buyerName: 'Jack Holloway',
    amount: 429.00,
    fee: 12.74,
    net: -429.00,
    currency: 'USD',
    status: 'REFUNDED',
    timestamp: '2026-11-08T22:18:32Z',
    paymentMethod: 'CREDIT_CARD'
  },
  {
    transactionId: '7PQ819203FF72819U',
    orderId: 'ORD-2026-88187',
    productId: 'PROD-102-MKB',
    productName: 'ErgoMech RGB Wireless Mechanical Keyboard',
    sku: 'SKU-102',
    buyerEmail: 'alina.zheng@codelab.org',
    buyerName: 'Alina Zheng',
    amount: 159.00,
    fee: 4.91,
    net: 154.09,
    currency: 'USD',
    status: 'COMPLETED',
    timestamp: '2026-11-08T19:40:11Z',
    paymentMethod: 'PAYPAL_BALANCE'
  },
  {
    transactionId: '3XZ918273GG62514T',
    orderId: 'ORD-2026-88186',
    productId: 'PROD-105-DMT',
    productName: 'BioDesk Dual-Motor Standing Desk Frame',
    sku: 'SKU-105',
    buyerEmail: 'b.foster@financelink.com',
    buyerName: 'Bradley Foster',
    amount: 319.00,
    fee: 9.55,
    net: 309.45,
    currency: 'USD',
    status: 'COMPLETED',
    timestamp: '2026-11-08T17:15:44Z',
    paymentMethod: 'CREDIT_CARD'
  },
  {
    transactionId: '2VB819204HH51423S',
    orderId: 'ORD-2026-88185',
    productId: 'PROD-106-WCM',
    productName: 'StreamCam 4K Studio Webcam & Ring Light',
    sku: 'SKU-106',
    buyerEmail: 'natalie.brooks@vividstream.tv',
    buyerName: 'Natalie Brooks',
    amount: 129.99,
    fee: 4.07,
    net: 125.92,
    currency: 'USD',
    status: 'COMPLETED',
    timestamp: '2026-11-08T15:22:09Z',
    paymentMethod: 'PAYPAL_BALANCE'
  }
];

export const INITIAL_DISPUTES: PayPalDispute[] = [
  {
    disputeId: 'PP-D-8829101',
    transactionId: '1MN392018EE83726V',
    amount: 429.00,
    currency: 'USD',
    reason: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED',
    status: 'UNDER_REVIEW',
    createTime: '2026-11-08T22:30:00Z',
    buyerNote: 'Display stand arrived with chipped paint and power adapter missing in the retail box.'
  },
  {
    disputeId: 'PP-D-8749202',
    transactionId: '6BC928172KK82710R',
    amount: 129.99,
    currency: 'USD',
    reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
    status: 'WAITING_FOR_SELLER',
    createTime: '2026-11-05T14:15:00Z',
    buyerNote: 'Tracking states delivered to front porch but no parcel found. Security cameras showed no carrier.'
  }
];

export const INITIAL_INVOICES: PayPalInvoice[] = [
  {
    invoiceId: 'INV2-9A8B-7C6D-5E4F',
    invoiceNumber: 'INV-2026-1044',
    recipientEmail: 'procurement@innovatestudio.com',
    recipientName: 'Innovate Design Studio LLC',
    amount: 3820.00,
    currency: 'USD',
    status: 'SENT',
    dueDate: '2026-11-15',
    invoiceDate: '2026-11-01'
  },
  {
    invoiceId: 'INV2-4D3C-2B1A-9Z8Y',
    invoiceNumber: 'INV-2026-1039',
    recipientEmail: 'accounts@nexustech.io',
    recipientName: 'Nexus Tech Co',
    amount: 2150.00,
    currency: 'USD',
    status: 'OVERDUE',
    dueDate: '2026-11-04',
    invoiceDate: '2026-10-21'
  },
  {
    invoiceId: 'INV2-5E6F-7G8H-9I0J',
    invoiceNumber: 'INV-2026-1028',
    recipientEmail: 'billing@scaleup.ventures',
    recipientName: 'ScaleUp Ventures',
    amount: 5400.00,
    currency: 'USD',
    status: 'PAID',
    dueDate: '2026-10-30',
    invoiceDate: '2026-10-15'
  }
];

export const INITIAL_AUDIT_LOGS: PriceAuditLog[] = [
  {
    id: 'LOG-001',
    sku: 'SKU-103',
    productName: 'HyperCharge 140W GaN Desktop Charger Hub',
    oldPrice: 94.99,
    newPrice: 89.99,
    changeType: 'AI_OPTIMIZATION',
    status: 'SUCCESS_PAYPAL_SANDBOX',
    timestamp: '2026-11-07T10:15:00Z',
    paypalBatchId: 'BTCH-PP-99281'
  },
  {
    id: 'LOG-002',
    sku: 'SKU-101',
    productName: 'AcousticPro ANC Wireless Headphones',
    oldPrice: 239.99,
    newPrice: 249.99,
    changeType: 'MANUAL_EDIT',
    status: 'SUCCESS_PAYPAL_SANDBOX',
    timestamp: '2026-11-05T14:30:00Z',
    paypalBatchId: 'BTCH-PP-99214'
  }
];

export const calculateMetrics = (products: PayPalProduct[], disputes: PayPalDispute[], invoices: PayPalInvoice[]): MerchantMetrics => {
  const grossRevenue = products.reduce((acc, p) => acc + p.grossRevenue30d, 0);
  const totalUnits = products.reduce((acc, p) => acc + p.unitsSold30d, 0);
  const totalRefunds = products.reduce((acc, p) => acc + p.refundCount30d, 0);
  const estimatedFees = grossRevenue * 0.029 + totalUnits * 0.30;
  const netPaymentVolume = grossRevenue - estimatedFees;
  const aov = totalUnits > 0 ? grossRevenue / totalUnits : 0;
  const refundRate = totalUnits > 0 ? (totalRefunds / totalUnits) * 100 : 0;

  const activeDisputesTotal = disputes.filter(d => d.status !== 'RESOLVED').length;
  const disputeRate = totalUnits > 0 ? (activeDisputesTotal / totalUnits) * 100 : 0;

  const unpaidInvoices = invoices.filter(i => i.status === 'SENT' || i.status === 'OVERDUE');
  const unpaidTotal = unpaidInvoices.reduce((acc, i) => acc + i.amount, 0);

  // Projected month-end revenue assuming current daily velocity
  const dailyAverage = grossRevenue / 30;
  const projectedMonthEnd = grossRevenue + (dailyAverage * 5); // project forward
  const revenueTarget = 320000.00;

  // Merchant health score based on dispute rate, refund rate, and sales velocity
  let healthScore = 96;
  if (disputeRate > 0.5) healthScore -= 10;
  if (refundRate > 2.0) healthScore -= 8;
  if (unpaidInvoices.some(i => i.status === 'OVERDUE')) healthScore -= 4;

  return {
    grossRevenue30d: Math.round(grossRevenue * 100) / 100,
    netPaymentVolume30d: Math.round(netPaymentVolume * 100) / 100,
    totalTransactions30d: totalUnits,
    averageOrderValue: Math.round(aov * 100) / 100,
    refundRate30d: Math.round(refundRate * 100) / 100,
    totalFees30d: Math.round(estimatedFees * 100) / 100,
    disputeRate: Math.round(disputeRate * 100) / 100,
    unpaidInvoicesTotal: Math.round(unpaidTotal * 100) / 100,
    unpaidInvoicesCount: unpaidInvoices.length,
    projectedMonthEndRevenue: Math.round(projectedMonthEnd * 100) / 100,
    revenueTarget,
    healthScore: Math.max(0, Math.min(100, healthScore))
  };
};
