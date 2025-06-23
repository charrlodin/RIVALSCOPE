import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log('Webhook event type:', eventType);

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('Error processing webhook', {
      status: 500
    });
  }
}

async function handleUserCreated(userData: any) {
  try {
    const { id, email_addresses, first_name, last_name } = userData;
    const primaryEmail = email_addresses.find((email: any) => email.id === userData.primary_email_address_id);

    if (!primaryEmail) {
      throw new Error('No primary email found');
    }

    // Create user in our database
    const user = await prisma.user.create({
      data: {
        id, // Use Clerk's user ID as our primary key
        email: primaryEmail.email_address,
        name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        subscription: {
          create: {
            plan: 'FREE',
            status: 'active'
          }
        }
      }
    });

    console.log('User created in database:', user.id);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function handleUserUpdated(userData: any) {
  try {
    const { id, email_addresses, first_name, last_name } = userData;
    const primaryEmail = email_addresses.find((email: any) => email.id === userData.primary_email_address_id);

    if (!primaryEmail) {
      throw new Error('No primary email found');
    }

    // Update user in our database
    await prisma.user.update({
      where: { id },
      data: {
        email: primaryEmail.email_address,
        name: `${first_name || ''} ${last_name || ''}`.trim() || null,
      }
    });

    console.log('User updated in database:', id);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

async function handleUserDeleted(userData: any) {
  try {
    const { id } = userData;

    // Delete user from our database (this will cascade delete related data)
    await prisma.user.delete({
      where: { id }
    });

    console.log('User deleted from database:', id);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}