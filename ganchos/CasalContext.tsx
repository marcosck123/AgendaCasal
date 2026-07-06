'use client';

import React, { createContext, useContext } from 'react';
import { useCasal, CasalState } from './useCasal';

const CasalContext = createContext<CasalState>({
  perfil: null,
  casal: null,
  parceiro: null,
  solo: true,
  loading: true,
  refresh: async () => {},
});

export function CasalProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const state = useCasal(userId);
  return <CasalContext.Provider value={state}>{children}</CasalContext.Provider>;
}

export function useCasalContext(): CasalState {
  return useContext(CasalContext);
}

/** Iniciais do casal para o selo da marca: "M&A", ou "M&?" quando solo. */
export function iniciaisCasal(nome1?: string | null, nome2?: string | null): string {
  const i1 = (nome1 ?? '').trim().charAt(0).toUpperCase();
  const i2 = (nome2 ?? '').trim().charAt(0).toUpperCase();
  if (i1 && i2) return `${i1}&${i2}`;
  if (i1) return `${i1}&?`;
  return '♥';
}
