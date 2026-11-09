import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_PRODUCTS,
  INITIAL_TRANSACTIONS,
  INITIAL_DISPUTES,
  INITIAL_INVOICES,
  INITIAL_AUDIT_LOGS,
  calculateMetrics
} from './src/mock/paypalData';
import { PayPalProduct, PriceAuditLog, PayPalDispute, PayPalInvoice } from './src/types/paypal';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const hasValidGeminiKey = () => {
  const k = process.env.GEMINI_API_KEY;
  return typeof k === 'string' && k.length > 10 && k !== 'MY_GEMINI_API_KEY';
};

// Initialize Google Gen AI client with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-Memory Merchant State (retaining edits during session)
let products: PayPalProduct[] = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
const transactions = JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));
let disputes: PayPalDispute[] = JSON.parse(JSON.stringify(INITIAL_DISPUTES));
let invoices: PayPalInvoice[] = JSON.parse(JSON.stringify(INITIAL_INVOICES));
let auditLogs: PriceAuditLog[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));

let paypalConfig = {
  clientId: '',
  clientSecret: '',
  isLiveSandbox: false,
  merchantId: 'PP-MCH-994821',
  environment: 'demo' as 'sandbox' | 'demo',
  lastSyncTime: new Date().toISOString()
};

// -------------------------------------------------------------
// PayPal REST API Endpoints
// -------------------------------------------------------------

// 1. Test / Connect PayPal Sandbox REST API credentials
app.post('/api/paypal/test-connection', async (req: Request, res: Response) => {
  try {
    const { clientId, clientSecret, isLiveSandbox } = req.body;

    if (isLiveSandbox && clientId && clientSecret) {
      // Attempt actual PayPal Sandbox OAuth Token generation
      try {
        const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials'
        });

        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          paypalConfig = {
            clientId,
            clientSecret,
            isLiveSandbox: true,
            merchantId: 'SANDBOX-LIVE-' + clientId.substring(0, 8),
            environment: 'sandbox',
            lastSyncTime: new Date().toISOString()
          };
          return res.json({
            success: true,
            mode: 'live-sandbox',
            message: 'Successfully authenticated with PayPal Sandbox OAuth endpoint!',
            tokenExpiresIn: tokenData.expires_in,
            scopes: tokenData.scope || 'https://api-m.paypal.com/v1/reporting/transactions https://api-m.paypal.com/v1/catalogs/products',
            endpointsConnected: [
              'GET /v1/reporting/transactions',
              'GET /v1/catalogs/products',
              'PATCH /v1/catalogs/products/{id}',
              'GET /v1/customer/disputes',
              'GET /v2/invoicing/invoices'
            ]
          });
        } else {
          const errorData = await tokenRes.text();
          return res.status(400).json({
            success: false,
            message: `PayPal Sandbox rejected credentials (${tokenRes.status}): ${errorData}. Fallback to simulated Sandbox available.`,
            mode: 'demo'
          });
        }
      } catch (err: any) {
        return res.status(500).json({
          success: false,
          message: `Network error connecting to api-m.sandbox.paypal.com: ${err.message}`,
          mode: 'demo'
        });
      }
    }

    // High-Fidelity Demo Sandbox Mode
    paypalConfig.isLiveSandbox = false;
    paypalConfig.environment = 'demo';
    paypalConfig.lastSyncTime = new Date().toISOString();

    return res.json({
      success: true,
      mode: 'demo-sandbox',
      message: 'Connected to PayPal High-Fidelity Sandbox Emulator with 8 active catalog products and 30-day reporting data.',
      merchantId: 'PP-MCH-994821-DEMO',
      endpointsConnected: [
        'GET /v1/reporting/transactions',
        'GET /v1/catalogs/products',
        'PATCH /v1/catalogs/products/{id}',
        'GET /v1/customer/disputes',
        'GET /v2/invoicing/invoices'
      ]
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. PayPal Catalog Products API: GET /v1/catalogs/products
app.get('/api/paypal/products', (_req: Request, res: Response) => {
  const metrics = calculateMetrics(products, disputes, invoices);
  res.json({
    products,
    metrics,
    config: paypalConfig
  });
});

// 3. PayPal Catalog Products API: PATCH /v1/catalogs/products/{id} (Price Update)
app.patch('/api/paypal/products/:id/price', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPrice, changeType = 'MANUAL_EDIT' } = req.body;

  const product = products.find(p => p.id === id || p.sku === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found in catalog' });
  }

  const oldPrice = product.currentPrice;
  const parsedPrice = parseFloat(Number(newPrice).toFixed(2));
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: 'Invalid price value' });
  }

  // Update product price
  product.currentPrice = parsedPrice;
  product.lastUpdated = new Date().toISOString();
  product.paypalSyncStatus = 'synced';

  // Recalculate elasticity recommendations based on new price
  const priceDelta = ((parsedPrice - product.competitorAvgPrice) / product.competitorAvgPrice) * 100;
  if (priceDelta > 10) {
    product.aiRecommendedPrice = parseFloat((product.competitorAvgPrice * 1.02).toFixed(2));
    product.aiRationale = `Price is currently +${priceDelta.toFixed(1)}% above competitor benchmark. Adjusted target toward market equilibrium.`;
  }

  // Create audit log
  const logEntry: PriceAuditLog = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sku: product.sku,
    productName: product.name,
    oldPrice,
    newPrice: parsedPrice,
    changeType,
    status: 'SUCCESS_PAYPAL_SANDBOX',
    timestamp: new Date().toISOString(),
    paypalBatchId: `BATCH-PP-${Date.now().toString().slice(-6)}`
  };
  auditLogs.unshift(logEntry);

  const metrics = calculateMetrics(products, disputes, invoices);
  return res.json({
    success: true,
    product,
    logEntry,
    metrics
  });
});

// 4. Bulk Price Optimization Update
app.post('/api/paypal/products/bulk-update-prices', (req: Request, res: Response) => {
  const { updates } = req.body as { updates: Array<{ id: string; newPrice: number }> };
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  const appliedLogs: PriceAuditLog[] = [];
  const batchId = `BATCH-BULK-${Date.now().toString().slice(-6)}`;

  updates.forEach(({ id, newPrice }) => {
    const p = products.find(prod => prod.id === id || prod.sku === id);
    if (p) {
      const old = p.currentPrice;
      p.currentPrice = parseFloat(Number(newPrice).toFixed(2));
      p.lastUpdated = new Date().toISOString();
      p.paypalSyncStatus = 'synced';

      const log: PriceAuditLog = {
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sku: p.sku,
        productName: p.name,
        oldPrice: old,
        newPrice: p.currentPrice,
        changeType: 'AI_OPTIMIZATION',
        status: 'SUCCESS_PAYPAL_SANDBOX',
        timestamp: new Date().toISOString(),
        paypalBatchId: batchId
      };
      appliedLogs.push(log);
      auditLogs.unshift(log);
    }
  });

  const metrics = calculateMetrics(products, disputes, invoices);
  return res.json({
    success: true,
    updatedCount: appliedLogs.length,
    products,
    appliedLogs,
    metrics
  });
});

// 5. PayPal Reporting & Transaction Search API: GET /v1/reporting/transactions
app.get('/api/paypal/transactions', (_req: Request, res: Response) => {
  res.json({
    transactions,
    totalRecords: transactions.length,
    reportingPeriodDays: 30
  });
});

// 6. Invoicing API (/v2/invoicing/invoices) & Disputes API (/v1/customer/disputes)
app.get('/api/paypal/disputes-and-invoices', (_req: Request, res: Response) => {
  const metrics = calculateMetrics(products, disputes, invoices);
  res.json({
    disputes,
    invoices,
    riskMetrics: {
      disputeRate: metrics.disputeRate,
      refundRate: metrics.refundRate30d,
      unpaidInvoicesTotal: metrics.unpaidInvoicesTotal,
      healthScore: metrics.healthScore,
      riskLevel: metrics.healthScore > 90 ? 'LOW' : metrics.healthScore > 75 ? 'MODERATE' : 'ELEVATED'
    }
  });
});

// 7. Audit Logs
app.get('/api/paypal/audit-logs', (_req: Request, res: Response) => {
  res.json({ logs: auditLogs });
});

// -------------------------------------------------------------
// AI Model Engine & Core Prompt Functions (Gemini 3.8 Flash)
// -------------------------------------------------------------

// AI Dynamic Elasticity Re-Optimization
app.post('/api/ai/optimize-elasticity', async (_req: Request, res: Response) => {
  try {
    const prompt = `You are an expert PayPal merchant revenue analyst and pricing strategist.
Analyze the following catalog items with historical 30-day velocity, competitor pricing, and current margins:

${JSON.stringify(
  products.map(p => ({
    sku: p.sku,
    name: p.name,
    currentPrice: p.currentPrice,
    costPrice: p.costPrice,
    competitorAvgPrice: p.competitorAvgPrice,
    stockLevel: p.stockLevel,
    unitsSold30d: p.unitsSold30d,
    refundRate: p.refundRate,
    elasticityScore: p.elasticityScore
  })),
  null,
  2
)}

For each product, evaluate its price elasticity ($E_d = \\% \\Delta Q / \\% \\Delta P$).
Determine whether the merchant should increase price (inelastic demand or low stock), reduce price (stagnant inventory or high elasticity), or align with competitors.
Return a clean JSON array with each item having:
- sku: string
- recommendedPrice: number (realistic price rounded to 2 decimal places, e.g. 264.99)
- elasticityScore: number (negative number, e.g. -0.85)
- rationale: string (concise 1-2 sentence executive explanation)
- confidence: number (70 to 98)
`;

    if (!hasValidGeminiKey()) {
      // Return enhanced algorithmic elasticity if key is not configured
      return res.json({
        success: true,
        source: 'algorithmic-fallback',
        recommendations: products.map(p => ({
          sku: p.sku,
          recommendedPrice: p.aiRecommendedPrice,
          elasticityScore: p.elasticityScore,
          rationale: p.aiRationale,
          confidence: p.aiConfidence
        }))
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Update in-memory recommendations
      parsed.forEach(item => {
        const p = products.find(prod => prod.sku === item.sku);
        if (p && item.recommendedPrice) {
          p.aiRecommendedPrice = Number(item.recommendedPrice);
          p.elasticityScore = Number(item.elasticityScore || p.elasticityScore);
          p.aiRationale = item.rationale || p.aiRationale;
          p.aiConfidence = Number(item.confidence || p.aiConfidence);
        }
      });
    }

    return res.json({
      success: true,
      source: 'gemini-3.8-flash',
      products
    });
  } catch (err: any) {
    console.error('Gemini elasticity optimization error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Chat-with-your-Store AI Agent
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const metrics = calculateMetrics(products, disputes, invoices);
    const contextData = {
      metrics,
      products: products.map(p => ({
        sku: p.sku,
        name: p.name,
        price: p.currentPrice,
        cost: p.costPrice,
        competitorPrice: p.competitorAvgPrice,
        unitsSold: p.unitsSold30d,
        stock: p.stockLevel,
        refundRate: `${p.refundRate}%`,
        elasticity: p.elasticityScore,
        aiPrice: p.aiRecommendedPrice
      })),
      disputes: disputes.map(d => ({
        id: d.disputeId,
        amount: d.amount,
        reason: d.reason,
        status: d.status
      })),
      invoices: invoices.map(i => ({
        number: i.invoiceNumber,
        amount: i.amount,
        status: i.status,
        dueDate: i.dueDate
      }))
    };

    const systemInstruction = `You are "PayPal Store AI Copilot", an advanced AI assistant embedded directly inside the merchant's PayPal intelligence dashboard.
You have real-time access to PayPal Sandbox APIs:
- Transaction Search (Gross Rev: $${metrics.grossRevenue30d}, AOV: $${metrics.averageOrderValue}, Total Orders: ${metrics.totalTransactions30d}, Refund Rate: ${metrics.refundRate30d}%)
- Catalog Products (8 active items with price elasticity scores)
- Disputes API (${disputes.length} active disputes)
- Invoicing API (${invoices.length} invoices, $${metrics.unpaidInvoicesTotal} unpaid)

Context Data:
${JSON.stringify(contextData, null, 2)}

Instructions:
1. Provide concise, professional, actionable financial insights. Use bullet points and bold formatting for numbers.
2. If asked about "refund rates", highlight products like UltraVision 27" (SKU-104 with 5.68% refund rate) and investigate reasons or dispute PP-D-8829101.
3. If asked about price simulations or discounts (e.g., "What happens if I discount top seller by 10%?"), calculate the exact margin change, volume elasticity effect, and revenue impact using elasticity scores.
4. If the user asks to update a price, formulate the exact recommended action.
5. Keep your tone crisp, enterprise-grade, and empowering.`;

    if (!hasValidGeminiKey()) {
      // Deterministic intelligent responses if no API key is set
      const lower = message.toLowerCase();
      let reply = '';
      if (lower.includes('refund') || lower.includes('return')) {
        const highestRefund = [...products].sort((a, b) => b.refundRate - a.refundRate)[0];
        reply = `**Refund Rate Analysis**:\n- Highest refund product: **${highestRefund.name} (${highestRefund.sku})** at **${highestRefund.refundRate}%** (5 refunds out of 88 orders).\n- **Primary Root Cause**: PayPal Dispute **PP-D-8829101** indicates physical packaging defects ("chipped stand paint and missing power cord").\n- **Recommendation**: Inspect batch packaging before raising prices or fulfilling upcoming orders.`;
      } else if (lower.includes('margin') || lower.includes('discount') || lower.includes('10%')) {
        const topSeller = [...products].sort((a, b) => b.unitsSold30d - a.unitsSold30d)[0];
        const newP = topSeller.currentPrice * 0.9;
        const currentMargin = ((topSeller.currentPrice - topSeller.costPrice) / topSeller.currentPrice) * 100;
        const newMargin = ((newP - topSeller.costPrice) / newP) * 100;
        reply = `**Price Discount Simulation (${topSeller.name})**:\n- **Current Price**: $${topSeller.currentPrice.toFixed(2)} (Margin: **${currentMargin.toFixed(1)}%**)\n- **10% Discounted Price**: $${newP.toFixed(2)} (Margin: **${newMargin.toFixed(1)}%**)\n- **Elasticity Effect**: With $E_d = ${topSeller.elasticityScore}$, demand will increase by approximately **+${Math.abs(topSeller.elasticityScore * 10).toFixed(1)}%** in volume.\n- **Conclusion**: Gross margin drops by **${(currentMargin - newMargin).toFixed(1)}%**, but total dollar volume would expand due to high elasticity.`;
      } else if (lower.includes('dispute') || lower.includes('risk') || lower.includes('health')) {
        reply = `**PayPal Dispute & Merchant Health Audit**:\n- Overall Merchant Health Score: **${metrics.healthScore}/100**\n- Active Disputes: **${disputes.length}** totaling **$${disputes.reduce((a, b) => a + b.amount, 0).toFixed(2)}**\n- Dispute Rate: **${metrics.disputeRate}%** (within safe PayPal acceptable threshold < 1.5%)\n- **Action Required**: Respond to dispute **PP-D-8749202** (waiting for seller delivery carrier proof) before the 7-day timer expires.`;
      } else {
        reply = `**Store Summary Overview**:\n- **Gross 30d Revenue**: $${metrics.grossRevenue30d.toLocaleString()}\n- **Active Products**: ${products.length} in PayPal Catalog\n- **AI Optimization Opportunity**: 5 SKUs currently exhibit price misalignment against competitor averages and elasticity curves.\n- You can ask me specific questions like: *"Which products have high elasticity?"*, *"Simulate 10% discount on top seller"*, or *"Analyze my invoice receivables"*.`;
      }

      return res.json({ reply, generatedAt: new Date().toISOString() });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction,
      }
    });

    return res.json({
      reply: response.text || 'Unable to generate response. Please try again.',
      generatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Gemini chat error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Executive Report Generation (for PDF report generation)
app.post('/api/ai/generate-executive-report', async (_req: Request, res: Response) => {
  try {
    const metrics = calculateMetrics(products, disputes, invoices);
    const prompt = `Generate a high-level C-Suite Executive Summary for our monthly PayPal Merchant Health & Pricing Strategy Briefing.
Metrics:
- 30-Day Gross Volume: $${metrics.grossRevenue30d}
- Total Orders: ${metrics.totalTransactions30d}
- AOV: $${metrics.averageOrderValue}
- Refund Rate: ${metrics.refundRate30d}%
- Dispute Rate: ${metrics.disputeRate}%
- Active Products: ${products.length}
- Unpaid Invoices Total: $${metrics.unpaidInvoicesTotal}
- Projected Month-End: $${metrics.projectedMonthEndRevenue} (Target: $${metrics.revenueTarget})

Products Data:
${JSON.stringify(products.map(p => ({ sku: p.sku, name: p.name, price: p.currentPrice, rec: p.aiRecommendedPrice, margin: `${(((p.currentPrice - p.costPrice)/p.currentPrice)*100).toFixed(1)}%` })), null, 2)}

Provide structured JSON:
{
  "executiveHeadline": "short punchy title",
  "monthlyPerformanceSummary": "2-3 paragraphs highlighting key financial velocity and milestones",
  "pricingElasticityTakeaways": ["key point 1", "key point 2", "key point 3"],
  "riskAndDisputeMitigation": "paragraph reviewing disputes, chargeback risk, and invoice collections",
  "strategicRoadmap": ["actionable priority 1", "actionable priority 2", "actionable priority 3"]
}`;

    if (!hasValidGeminiKey()) {
      return res.json({
        report: {
          executiveHeadline: "November 2026 Merchant Revenue & Price Elasticity Briefing",
          monthlyPerformanceSummary: `During the preceding 30-day reporting window, the merchant generated $${metrics.grossRevenue30d.toLocaleString()} across ${metrics.totalTransactions30d} transactions, maintaining a strong Average Order Value (AOV) of $${metrics.averageOrderValue.toFixed(2)}. Net payment volume settled at $${metrics.netPaymentVolume30d.toLocaleString()} after accounting for standard PayPal payment processing fees of $${metrics.totalFees30d.toLocaleString()}.\n\nCurrent revenue velocity projects month-end gross volume at $${metrics.projectedMonthEndRevenue.toLocaleString()}, reaching 101.4% of the quarterly revenue target of $${metrics.revenueTarget.toLocaleString()}.`,
          pricingElasticityTakeaways: [
            "AcousticPro ANC Headphones (SKU-101) exhibits inelastic demand (E = -0.82), presenting a prime opportunity to capture +$4,900 gross margin by raising price to $264.99.",
            "HyperCharge 140W Charger (SKU-103) is highly elastic (E = -1.88); lowering unit price to $79.99 will unlock high-velocity search placements and expand unit volume by +24%.",
            "UltraVision 27\" Monitor (SKU-104) has constrained inventory (24 units); price hike to $449 protects against stockout while matching competitor ceilings."
          ],
          riskAndDisputeMitigation: `PayPal Disputes API monitoring identifies 2 active disputes totaling $558.99, yielding a benign dispute rate of ${metrics.disputeRate}%, comfortably under the 1.5% merchant monitoring threshold. Outstanding invoices total $${metrics.unpaidInvoicesTotal.toLocaleString()} across 2 corporate accounts, with 1 invoice in overdue status requiring automated dunning reminders.`,
          strategicRoadmap: [
            "Execute one-click batch pricing adjustments for 5 misaligned SKUs via PayPal Catalog API.",
            "Resolve active tracking dispute PP-D-8749202 within 48 hours to protect merchant health score.",
            "Activate scenario simulator elasticity thresholds on computer peripherals prior to upcoming holiday sales."
          ]
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const report = JSON.parse(response.text || '{}');
    return res.json({ report });
  } catch (err: any) {
    console.error('Gemini report generation error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Vite Dev Server / Static File Serving
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PayPal AI Toolkit Server] Running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
