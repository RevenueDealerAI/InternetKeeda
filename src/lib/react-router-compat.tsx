'use client';

import { useRouter, usePathname, useSearchParams, useParams as useNextParams } from 'next/navigation';
import NextLinkComponent from 'next/link';
import { ReactNode, useContext, createContext } from 'react';

const ParamsContext = createContext<Record<string, string>>({});
export { ParamsContext };

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
  const contextParams = useContext(ParamsContext);
  const nextParams = useNextParams();
  const pathname = usePathname();
  
  if (Object.keys(contextParams).length > 0) {
    return contextParams as T;
  }
  
  if (nextParams && Object.keys(nextParams).length > 0) {
    return nextParams as T;
  }
  const routeParams: Record<string, string> = {};
  const currentPath = pathname || '';
  
  if (currentPath.includes('/ai-tools/')) {
    const match = currentPath.match(/\/ai-tools\/([^/]+)/);
    if (match) routeParams.slug = match[1];
  }
  
  if (currentPath.includes('/blog/')) {
    const match = currentPath.match(/\/blog\/([^/]+)/);
    if (match) routeParams.slug = match[1];
  }
  
  if (currentPath.includes('/news/')) {
    const match = currentPath.match(/\/news\/([^/]+)/);
    if (match) routeParams.slug = match[1];
  }
  
  if (currentPath.includes('/category/')) {
    const match = currentPath.match(/\/category\/([^/]+)/);
    if (match) routeParams.id = match[1];
  }
  
  if (currentPath.includes('/ai-tool/')) {
    const match = currentPath.match(/\/ai-tool\/([^/]+)/);
    if (match) routeParams.id = match[1];
  }
  
  if (currentPath.includes('/product/')) {
    const match = currentPath.match(/\/product\/([^/]+)/);
    if (match) routeParams.id = match[1];
  }
  
  if (currentPath.includes('/software/')) {
    const match = currentPath.match(/\/software\/([^/]+)/);
    if (match) routeParams.slug = match[1];
  }
  
  return routeParams as T;
}

interface LinkProps {
  to?: string;
  href?: string;
  children?: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  [key: string]: unknown;
}

export function Link({ href, to, children, ...props }: LinkProps) {
  const linkHref = (href || to || '/') as string;
  return <NextLinkComponent href={linkHref} {...props}>{children}</NextLinkComponent>;
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useRouter();
  
  if (typeof window !== 'undefined') {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }
  
  return null;
}

export function Outlet({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
