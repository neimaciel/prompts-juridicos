import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2023-10-16'
});

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceId: string;
  tokens: number;
  price: number;
  currency: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Plano Gratuito',
    priceId: '',
    tokens: 500,
    price: 0,
    currency: 'BRL',
    features: [
      '500 tokens mensais',
      'Análise básica de contratos',
      'Detecção de dados sensíveis',
      'Suporte por email'
    ]
  },
  {
    id: 'professional',
    name: 'Plano Profissional',
    priceId: 'price_professional_monthly',
    tokens: 5000,
    price: 4990, // R$ 49,90 in cents
    currency: 'BRL',
    features: [
      '5.000 tokens mensais',
      'Análise avançada com IA',
      'Criptografia de dados sensíveis',
      'Relatórios em PDF',
      'Suporte prioritário'
    ]
  },
  {
    id: 'enterprise',
    name: 'Plano Empresarial',
    priceId: 'price_enterprise_monthly',
    tokens: 25000,
    price: 19990, // R$ 199,90 in cents
    currency: 'BRL',
    features: [
      '25.000 tokens mensais',
      'Análise completa com todas as IAs',
      'Criptografia AES-256-GCM',
      'API dedicada',
      'Dashboard administrativo',
      'Suporte 24/7'
    ]
  }
];

export class StripeService {
  
  async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    return await stripe.customers.create({
      email,
      name: name || email.split('@')[0],
      metadata: {
        source: 'contract-analysis-system'
      }
    });
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card', 'pix'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        source: 'contract-analysis-system'
      }
    });
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.retrieve(subscriptionId);
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.cancel(subscriptionId);
  }

  async updateSubscription(
    subscriptionId: string,
    priceId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    return await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });
  }

  async handleWebhook(signature: string, payload: string): Promise<Stripe.Event> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  getPlanByPriceId(priceId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find(plan => plan.priceId === priceId);
  }

  getPlanById(planId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
  }

  async createProduct(name: string, description: string): Promise<Stripe.Product> {
    return await stripe.products.create({
      name,
      description,
      metadata: {
        source: 'contract-analysis-system'
      }
    });
  }

  async createPrice(
    productId: string,
    amount: number,
    currency: string = 'brl',
    interval: 'month' | 'year' = 'month'
  ): Promise<Stripe.Price> {
    return await stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency,
      recurring: {
        interval
      }
    });
  }
}

export const stripeService = new StripeService();