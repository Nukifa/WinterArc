import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { fetchConditions, type StationConditions } from '@/api/openMeteo';
import { fetchSnowReports, type SnowReports } from '@/api/snowReports';
import { STATIONS } from '@/data/stations';

const MAX_AGE_MS = 30 * 60 * 1000; // 30 min

type State = {
  /** Prévisions et estimations Open-Meteo */
  data: Record<string, StationConditions>;
  /** Relevés mesurés Météo-France */
  reports: SnowReports | null;
  loading: boolean;
  error: string | null;
  updatedAt: number | null;
  /** Heure de la dernière récupération réussie des prévisions Open-Meteo */
  forecastAt: number | null;
  refresh: (force?: boolean) => Promise<void>;
};

const ConditionsContext = createContext<State | null>(null);

export function ConditionsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Record<string, StationConditions>>({});
  const [reports, setReports] = useState<SnowReports | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [forecastAt, setForecastAt] = useState<number | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(
    async (force = false) => {
      if (inFlight.current) return;
      if (!force && updatedAt && Date.now() - updatedAt < MAX_AGE_MS) return;
      inFlight.current = true;
      setLoading(true);
      setError(null);
      const [forecast, measured] = await Promise.allSettled([fetchConditions(STATIONS), fetchSnowReports()]);
      if (forecast.status === 'fulfilled') {
        setData(forecast.value);
        setForecastAt(Date.now());
      }
      if (measured.status === 'fulfilled') setReports(measured.value);
      const errors = [forecast, measured]
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => (r.reason instanceof Error ? r.reason.message : 'Erreur réseau'));
      setError(errors.length ? errors.join(' · ') : null);
      if (errors.length < 2) setUpdatedAt(Date.now());
      inFlight.current = false;
      setLoading(false);
    },
    [updatedAt],
  );

  useEffect(() => {
    // Chargement initial, différé pour ne pas modifier l'état pendant l'effet
    Promise.resolve().then(() => refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ConditionsContext.Provider value={{ data, reports, loading, error, updatedAt, forecastAt, refresh }}>
      {children}
    </ConditionsContext.Provider>
  );
}

export function useConditions(): State {
  const ctx = useContext(ConditionsContext);
  if (!ctx) throw new Error('useConditions doit être utilisé dans <ConditionsProvider>');
  return ctx;
}
