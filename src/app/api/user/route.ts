import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user from Clerk to get email
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || `user-${userId}@rivalscope.com`;

    // Upsert user - create if doesn't exist, otherwise return existing
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        // Update email if it changed
        email: userEmail,
      },
      create: {
        id: userId,
        email: userEmail,
        signalsBalance: 50, // Free trial signals
      },
      include: {
        _count: {
          select: {
            competitors: true,
            signalTransactions: true
          }
        },
        signalPurchases: {
          where: {
            expiresAt: {
              gt: new Date()
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}