
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { grantPlanAccess, getPlanById } from '@/lib/data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received payment verification request with body:", JSON.stringify(body, null, 2));

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
        console.error(error, { receivedBody: body });
        return NextResponse.json({ error }, { status: 400 });
    }
    
    if(!process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay key secret is not set in environment variables.');
    }

    const hmacBody = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(hmacBody.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Fetch plan details to get trainerId and price for the sales record
      const plan = await getPlanById(planId);
      if (!plan) {
          return NextResponse.json({ error: 'Plan not found for purchase record.' }, { status: 404 });
      }

      // Signature is authentic, grant access to the plan and record the sale
      await grantPlanAccess(userId, plan, razorpay_payment_id);

      return NextResponse.json({ success: true, message: "Payment verified successfully." });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid signature.' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed.' }, { status: 500 });
  }
}
