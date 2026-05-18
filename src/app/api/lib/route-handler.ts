import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse, errorResponse } from './auth';
import { connectDB } from './db';

/**
 * Helper to handle route with authentication
 */
export async function withAuth(
  handler: (req: NextRequest, context: { userId: string; params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    try {
      await connectDB();
      
      // Require auth for non-GET requests
      if (req.method !== 'GET') {
        try {
          const auth = await requireAuth();
          const params = await context.params;
          return await handler(req, { userId: auth.userId, params });
        } catch (error) {
          console.error('Auth error:', error);
          return unauthorizedResponse();
        }
      } else {
        const params = await context.params;
        // For GET requests, auth is optional
        const auth = await requireAuth().catch(() => null);
        return await handler(req, { 
          userId: auth?.userId || '', 
          params 
        });
      }
    } catch (error: unknown) {
      console.error('Route handler error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(errorMessage, 500);
    }
  };
}

/**
 * Helper to handle route without authentication
 */
export async function withoutAuth(
  handler: (req: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    try {
      await connectDB();
      const params = await context.params;
      return await handler(req, { params });
    } catch (error: unknown) {
      console.error('Route handler error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(errorMessage, 500);
    }
  };
}

/**
 * Parse request body as JSON
 */
export async function parseBody<T = Record<string, unknown>>(req: NextRequest): Promise<T> {
  try {
    return await req.json();
  } catch (error) {
    throw new Error('Invalid JSON body');
  }
}

/**
 * Get query parameters from request
 */
export function getQueryParams(req: NextRequest): URLSearchParams {
  const url = new URL(req.url);
  return url.searchParams;
}

