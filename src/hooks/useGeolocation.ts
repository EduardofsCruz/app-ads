import { useEffect, useState } from "react";
import { ESPLANADA_CENTER } from "@/lib/geolocation";

interface GeoState {
  latitude: number;
  longitude: number;
  loading: boolean;
  permitido: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    ...ESPLANADA_CENTER,
    loading: true,
    permitido: false,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          loading: false,
          permitido: true,
        });
      },
      () => {
        setState((s) => ({ ...s, loading: false, permitido: false }));
      },
      { timeout: 8000 },
    );
  }, []);

  return state;
}
