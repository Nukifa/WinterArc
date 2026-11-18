import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { fetchConditions, type StationConditions } from '@/api/openMeteo';
import { STATIONS } from '@/data/stations';

const MAX_AGE_MS = 30 * 60 * 1000; // 30 min

type State = {
  data: Record<string, StationConditions>;
  loading: boolean;
  error: string | null;
  updatedAt: number | null;
  refresh: (force?: boolean) => Promise<void>;
};

const ConditionsContext = createContext<State | null>(null);

export function ConditionsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Record<string, StationConditions>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(
    async (force = false) => {
      if (inFlight.current) return;
      if (!force && updatedAt && Date.now() - updatedAt < MAX_AGE_MS) return;
      inFlight.current = true;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchConditions(STATIONS);
        setData(res);
        setUpdatedAt(Date.now());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur réseau');
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    },
    [updatedAt],
  );

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ConditionsContext.Provider value={{ data, loading, error, updatedAt, refresh }}>
      {children}
    </ConditionsContext.Provider>
  );
}

export function useConditions(): State {
  const ctx = useContext(ConditionsContext);
  if (!ctx) throw new Error('useConditions doit être utilisé dans <ConditionsProvider>');
  return ctx;
}
