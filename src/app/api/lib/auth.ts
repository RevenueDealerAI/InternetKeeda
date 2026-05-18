import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthContext {
  userId: string;
}

export async function requireAuth(req?: NextRequest): Promise<AuthContext> {
  // Use Clerk's auth() function which handles cookies automatically
  // This is the recommended way for Next.js App Router with Clerk
  try {
    const authResult = await auth();
    const userId = authResult.userId;
    
    if (!userId) {
      throw new Error('Unauthorized');
    }
    
    return { userId };
  } catch (error) {
    // Log the error for debugging
    console.error('Authentication error:', error);
    throw new Error('Unauthorized');
  }
}

export async function getAuth() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }
  
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Create an error response
 */
export function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

