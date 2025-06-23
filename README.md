# 🔍 RivalScope

**Automated Competitor Monitoring Platform with Neo-Brutalist Design**

RivalScope is a powerful competitor monitoring platform that automatically tracks your competitors' websites for changes in pricing, content, and features. Built with a bold neo-brutalist design that makes monitoring your competition both effective and visually striking.

## ✨ Features

### 🎯 **Core Monitoring**
- **Automated Web Scraping** powered by Firecrawl.dev
- **Change Detection** for pricing, content, and feature updates
- **Real-time Alerts** via email notifications
- **Smart Reporting** with actionable insights

### 🎨 **Neo-Brutalist Design**
- **Bold Typography** with high contrast elements
- **Geometric Layouts** with intentional rotations and shadows
- **Vibrant Color Palette** (Yellow, Pink, Cyan, Green)
- **Aggressive Visual Hierarchy** for maximum impact

### 💰 **Flexible Pricing**
- **Free Tier**: 1 website, weekly checks
- **Starter Plan**: 5 websites, daily checks, email alerts ($49/month)
- **Pro Plan**: 20 websites, hourly checks, advanced features ($99/month)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Firecrawl.dev API key
- Stripe account (for payments)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd rivalscope
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Fill in your environment variables
   ```

3. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see your brutal competitor monitoring platform!

## 🛠 Tech Stack

### **Frontend**
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** with custom neo-brutalist design system
- **Clerk** for authentication and user management

### **Backend**
- **Next.js API Routes**
- **Prisma ORM** with PostgreSQL
- **Firecrawl.dev** for web scraping
- **Stripe** for subscription management

### **Services**
- **Clerk** for user authentication and management
- **Nodemailer** for email notifications
- **Prisma Client** for database operations
- **Svix** for webhook verification

## 🔧 Configuration

### **Environment Variables**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/rivalscope"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
CLERK_WEBHOOK_SECRET="your-clerk-webhook-secret"

# Firecrawl API
FIRECRAWL_API_KEY="your-firecrawl-api-key"

# Stripe
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-email-password"
```

### **Clerk Setup**
1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Copy your publishable and secret keys to `.env.local`
3. Set up webhook endpoint: `/api/webhooks/clerk` for user sync
4. Required webhook events: `user.created`, `user.updated`, `user.deleted`

### **Database Scripts**
```bash
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate    # Create and run migrations
npm run db:studio     # Open Prisma Studio
npm run db:reset      # Reset database (destructive)
```

## 🎨 Design System

### **Colors**
- **Primary Yellow**: `#ffff00` - Call-to-action buttons
- **Hot Pink**: `#ff69b4` - Secondary elements
- **Electric Cyan**: `#00ffff` - Accent highlights
- **Lime Green**: `#00ff00` - Success states
- **Pure Black**: `#000000` - Borders and text
- **Pure White**: `#ffffff` - Backgrounds

### **Typography**
- **Headers**: Bold, uppercase, high-contrast
- **Body**: Monospace font for technical feel
- **UI Elements**: All caps for maximum impact

### **Components**
- **Brutal Shadows**: `8px 8px 0px 0px #000000`
- **Thick Borders**: `4px solid #000000`
- **Intentional Rotations**: `-2deg` to `2deg` transforms
- **High Contrast**: Pure black text on bright backgrounds

## 🔐 Authentication

RivalScope uses Clerk for modern authentication:
- **User Registration & Login**: Modal-based sign up/sign in
- **Session Management**: Secure JWT sessions with automatic refresh
- **User Management**: Profile management, email verification
- **Database Sync**: Webhook integration to sync users with Prisma
- **Protected Routes**: Middleware-based route protection

---

**Built with ❤️ and a lot of ⚡BRUTAL ENERGY⚡**

*Keep your enemies closer, and your competitors even closer.*
