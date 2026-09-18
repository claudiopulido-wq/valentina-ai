import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from './lib/rateLimiter';

const apiRateLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 30 });

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(header, value);
  }
  return response;
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const key = `${ip}:${request.nextUrl.pathname}`;

    if (apiRateLimiter.hit(key)) {
      return withSecurityHeaders(
        NextResponse.json(
          {
            error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.',
            code: 'RATE_LIMITED',
          },
          { status: 429 }
        )
      );
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: '/:path*',
};
