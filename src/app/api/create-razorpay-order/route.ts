
import { NextResponse } from 'next/server';
import { razorpayInstance } from '@/lib/razorpay';
import { getPlanById } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required.' }, { status: 400 });
    }
    
    const plan = await getPlanById(planId);

    if (!plan || plan.price <= 0) {
      return NextResponse.json({ error: 'Plan is not purchasable or does not exist.' }, { status: 400 });
    }

    const options = {
        amount: Math.round(plan.price * 100), 
        currency: "INR",
        receipt: `receipt_plan_${uuidv4()}`
    };

    const order = await razorpayInstance.orders.create(options);
    
    return NextResponse.json(order);

  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: error.message || 'Failed to create Razorpay order.' }, { status: 500 });
  }
}
