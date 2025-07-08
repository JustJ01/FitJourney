
import { NextResponse } from 'next/server';
import { razorpayInstance } from '@/lib/razorpay';
import { getPlanById } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { planId } = await request.json();

    if (!planId) {
      console.error('[API/create-razorpay-order] Error: Plan ID is required.');
      return NextResponse.json({ error: 'Plan ID is required.' }, { status: 400 });
    }
    
    console.log(`[API/create-razorpay-order] Creating order for planId: ${planId}`);
    const plan = await getPlanById(planId);

    if (!plan || plan.price <= 0) {
      console.error(`[API/create-razorpay-order] Error: Plan with ID ${planId} is not purchasable or does not exist.`);
      return NextResponse.json({ error: 'Plan is not purchasable or does not exist.' }, { status: 400 });
    }

    const amountInPaise = Math.round(plan.price * 100);

    if (amountInPaise < 100) { // Razorpay minimum is 1 INR (100 paise)
      console.error(`[API/create-razorpay-order] Error: The price must be at least ₹1.00. Current amount: ${amountInPaise} paise.`);
      return NextResponse.json({ error: 'The price must be at least ₹1.00 to be processed.' }, { status: 400 });
    }

    const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${uuidv4().replace(/-/g, "").substring(0, 20)}`
    };

    console.log('[API/create-razorpay-order] Creating Razorpay order with options:', options);
    const order = await razorpayInstance.orders.create(options);
    console.log('[API/create-razorpay-order] Razorpay order created successfully:', order);
    
    return NextResponse.json(order);

  } catch (error: any) {
    console.error('Error creating Razorpay order. Full error object:', JSON.stringify(error, null, 2));
    const errorMessage = error?.error?.description || error.message || 'Failed to create Razorpay order.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
