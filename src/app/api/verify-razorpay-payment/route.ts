
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { grantPlanAccess } from '@/lib/data';

export async function POST(request: Request) {
  try {
    const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        userId,
        planId 
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !planId) {
        return NextResponse.json({ error: 'Missing required payment verification fields.' }, { status: 400 });
    }
    
    if(!process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay key secret is not set in environment variables.');
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      await grantPlanAccess(userId, planId, razorpay_payment_id);

      return NextResponse.json({ success: true, message: "Payment verified successfully." });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid signature.' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed.' }, { status: 500 });
  }
}
