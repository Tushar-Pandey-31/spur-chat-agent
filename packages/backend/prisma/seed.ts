import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KNOWLEDGE_DOCS = [
  {
    title: 'Shipping Policy',
    category: 'shipping',
    content:
      'We offer free standard shipping on all orders over $50 within the continental United States. Standard shipping takes 5-7 business days. Express shipping (2-3 business days) is available for $12.99. We currently ship to all 50 US states and select international destinations. International shipping rates vary by location and are calculated at checkout. All orders are processed within 1-2 business days.',
  },
  {
    title: 'Return & Refund Policy',
    category: 'returns',
    content:
      'We accept returns within 30 days of delivery for a full refund. Items must be unused, in original packaging, and with all tags attached. To initiate a return, visit our Returns Center or contact support. Refunds are processed within 5-7 business days after we receive the returned item. Sale items and personalized products are final sale and cannot be returned. Exchanges are available for different sizes or colors of the same item.',
  },
  {
    title: 'Support Hours',
    category: 'support',
    content:
      'Our customer support team is available Monday through Friday, 9 AM to 6 PM EST. Live chat support is available during these hours for immediate assistance. Email support is available 24/7 at support@spurshop.com — we aim to respond within 24 hours. For urgent issues outside business hours, please leave a message and we will prioritize your request the next business day.',
  },
  {
    title: 'Payment Methods',
    category: 'payment',
    content:
      'We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, Apple Pay, Google Pay, and Shop Pay. All transactions are secured with 256-bit SSL encryption. We also offer Buy Now, Pay Later through Klarna and Afterpay — split your purchase into 4 interest-free payments.',
  },
  {
    title: 'Order Tracking',
    category: 'tracking',
    content:
      'Once your order ships, you will receive a confirmation email with a tracking number. You can track your order status at any time by visiting our Order Tracking page and entering your order number and email. You can also check your order status by logging into your account. If your tracking shows "delivered" but you have not received your package, please contact us within 48 hours.',
  },
  {
    title: 'Account & Privacy',
    category: 'account',
    content:
      'Creating an account is optional but recommended for a faster checkout experience. We never sell or share your personal information with third parties. You can request deletion of your account and all associated data at any time by contacting privacy@spurshop.com. We use industry-standard encryption to protect your data.',
  },
  {
    title: 'Product Quality Guarantee',
    category: 'quality',
    content:
      'All our products come with a 1-year manufacturer warranty against defects. If you receive a damaged or defective item, contact us immediately with photos and we will send a replacement at no additional cost. We source our products from vetted suppliers and conduct regular quality checks.',
  },
];

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.knowledgeDocument.deleteMany();

  // Seed knowledge documents
  await prisma.knowledgeDocument.createMany({
    data: KNOWLEDGE_DOCS,
  });

  console.log(`Seeded ${KNOWLEDGE_DOCS.length} knowledge documents`);

  // Create a sample conversation for testing
  const conversation = await prisma.conversation.create({
    data: {
      sessionId: '00000000-0000-0000-0000-000000000001',
      messages: {
        create: [
          {
            role: 'system',
            content:
              'You are a helpful support agent for Spur Shop, a small e-commerce store. Answer clearly and concisely.',
          },
          {
            role: 'user',
            content: 'Do you ship to Canada?',
          },
          {
            role: 'assistant',
            content:
              'Yes! We ship to select international destinations, including Canada. International shipping rates vary by location and are calculated at checkout. Standard shipping to Canada typically takes 7-14 business days. Is there anything else I can help you with?',
          },
        ],
      },
    },
    include: { messages: true },
  });

  console.log(`Created sample conversation with ${conversation.messages.length} messages`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
