'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ComponentProps } from 'react';

export function useNavigate() {
  const router = useRouter();
  
  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === 'number') {
      if (to === -1) {
        router.back();
      } else {
        router.forward();
      }
    } else {
      if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    }
  };
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  return {
    pathname: pathname || '/',
    search: searchParams ? `?${searchParams.toString()}` : '',
    hash: '',
    state: null,
  };
}

export function useParams<T = Record<string, string>>(): T {
  const pathname = usePathname();
  const params: Record<string, string> = {};
  
  const segments = pathname?.split('/').filter(Boolean) || [];
  
  return params as T;
}

export function NextLink({ href, children, ...props }: ComponentProps<typeof Link> & { to?: string }) {
  const linkHref = href || (props as { to?: string }).to || '/';
  return <Link href={linkHref} {...props}>{children}</Link>;
}

export { NextLink as Link };

