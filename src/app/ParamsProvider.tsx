'use client';

import { ReactNode, use } from 'react';
import { useParams as useNextParams } from 'next/navigation';
import { ParamsContext } from '@/lib/react-router-compat';

export function ParamsProvider({ children, params }: { children: ReactNode; params?: Promise<Record<string, string>> | Record<string, string> }) {
  const nextParams = useNextParams();
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const allParams = { ...nextParams, ...resolvedParams } as Record<string, string>;
  
  return (
    <ParamsContext.Provider value={allParams}>
      {children}
    </ParamsContext.Provider>
  );
}

