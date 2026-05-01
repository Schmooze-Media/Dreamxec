const { z } = require('zod');

// ─── Create Order ────────────────────────────────────────────────────────────
const createOrderSchema = z.object({
  amount: z.number({ required_error: 'Amount is required' })
    .positive('Amount must be a positive number'),
  projectId: z.string().min(1, 'Project ID is required'),
  email: z.string().email('Invalid email').optional(),
  name: z.string().optional(),
  message: z.string().optional(),
  anonymous: z.boolean().optional(),
});

// ─── Verify Payment ──────────────────────────────────────────────────────────
const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID required'),
  razorpay_signature: z.string().min(1, 'Signature required'),
});

module.exports = { createOrderSchema, verifyPaymentSchema };
