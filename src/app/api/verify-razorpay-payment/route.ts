
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { grantPlanAccess, getPlanById } from '@/lib/data';

export async function POST(request: Request) {
  const requestBody = await request.text();
  try {
    console.log("[API/verify-razorpay-payment] Received request with body:", requestBody);
    const body = JSON.parse(requestBody);

    const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        userId,
        planId 
    } = body;

    const missingFields = [];
    if (!razorpay_order_id) missingFields.push("razorpay_order_id");
    if (!razorpay_payment_id) missingFields.push("razorpay_payment_id");
    if (!razorpay_signature) missingFields.push("razorpay_signature");
    if (!userId) missingFields.push("userId");
    if (!planId) missingFields.push("planId");

    if (missingFields.length > 0) {
        const error = `Missing required payment verification fields: ${missingFields.join(', ')}`;
        console.error(`[API/verify-razorpay-payment] ${error}`, { receivedBody: body });
        return NextResponse.json({ error }, { status: 400 });
    }
    
    if(!process.env.RAZORPAY_KEY_SECRET) {
        console.error('[API/verify-razorpay-payment] Razorpay key secret is not set in environment variables.');
        throw new Error('Server configuration error: Razorpay key secret is not set.');
    }

    const hmacBody = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(hmacBody.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      console.log(`[API/verify-razorpay-payment] Signature is authentic for order ${razorpay_order_id}. Granting access.`);
      // Fetch plan details to get trainerId and price for the sales record
      const plan = await getPlanById(planId);
      if (!plan) {
          console.error(`[API/verify-razorpay-payment] Plan not found with ID ${planId} for purchase record.`);
          return NextResponse.json({ error: 'Plan not found for purchase record.' }, { status: 404 });
      }

      // Signature is authentic, grant access to the plan and record the sale
      await grantPlanAccess(userId, plan, razorpay_payment_id);

      return NextResponse.json({ success: true, message: "Payment verified successfully." });
    } else {
      console.error(`[API/verify-razorpay-payment] Invalid signature for order ${razorpay_order_id}.`);
      return NextResponse.json({ success: false, error: 'Invalid signature.' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[API/verify-razorpay-payment] Error verifying Razorpay payment:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed.' }, { status: 500 });
  }
}
