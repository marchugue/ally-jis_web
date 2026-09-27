// src/context/MaintenanceContext.tsx

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMaintenanceStatus, MAINTENANCE_MODE_EVENT } from '@/api/client';
import { toast } from 'sonner';

interface MaintenanceContextValue {
  isMaintenance: boolean;
  maintenanceMessage: string;
  isChecking: boolean;
  checkMaintenance: (notifyOnFail?: boolean) => Promise<boolean>;
  setManualMaintenance: (active: boolean, message?: string) => void;
  isPreview: boolean;
  setPreview: (preview: boolean) => void;
}

const MaintenanceContext = createContext<MaintenanceContextValue>({
  isMaintenance: false,
  maintenanceMessage: '',
  isChecking: false,
  checkMaintenance: async () => false,
  setManualMaintenance: () => {},
  isPreview: false,
  setPreview: () => {},
});

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Ally-jis is undergoing scheduled maintenance. Please check back shortly.'
  );
  const [isChecking, setIsChecking] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if URL specifies ?preview=true
  const searchParams = new URLSearchParams(location.search);
  const [isPreview, setIsPreview] = useState(searchParams.get('preview') === 'true');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('preview') === 'true') {
      setIsPreview(true);
    }
  }, [location.search]);

  // Check maintenance status against /health/status
  const checkMaintenance = useCallback(async (notifyOnFail = false): Promise<boolean> => {
    setIsChecking(true);
    try {
      const status = await getMaintenanceStatus();
      if (status.ok) {
        setIsMaintenance(Boolean(status.maintenance));
        if (status.message) {
          setMaintenanceMessage(status.message);
        }

        if (status.maintenance) {
          if (notifyOnFail) {
            toast.info('Maintenance in Progress', {
              description: 'The platform is still undergoing upgrades. We appreciate your patience!',
              id: 'maintenance-check-info',
            });
          }
          return true;
        } else {
          // Maintenance is OFF
          if (isMaintenance) {
            toast.success('System Back Online!', {
              description: 'Maintenance is complete. Platform access has been restored.',
              id: 'maintenance-restored',
            });
          }
          return false;
        }
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [isMaintenance]);

  // Initial check on mount (avoid running if already on admin paths)
  useEffect(() => {
    if (!location.pathname.startsWith('/admin')) {
      checkMaintenance(false);
    }
  }, [checkMaintenance, location.pathname]);

  // Listen to global 503 maintenance mode event from http.ts
  useEffect(() => {
    const handleMaintenanceEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ active: boolean; message: string }>;
      if (customEvent.detail) {
        setIsMaintenance(true);
        if (customEvent.detail.message) {
          setMaintenanceMessage(customEvent.detail.message);
        }
      }
    };

    window.addEventListener(MAINTENANCE_MODE_EVENT, handleMaintenanceEvent);
    return () => window.removeEventListener(MAINTENANCE_MODE_EVENT, handleMaintenanceEvent);
  }, []);

  // When maintenance is active, auto-poll every 15 seconds to detect when maintenance ends
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (isMaintenance) {
      pollIntervalRef.current = setInterval(() => {
        checkMaintenance(false);
      }, 15_000);
    } else if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isMaintenance, checkMaintenance]);

  const setManualMaintenance = (active: boolean, message?: string) => {
    setIsMaintenance(active);
    if (message) {
      setMaintenanceMessage(message);
    }
  };

  return (
    <MaintenanceContext.Provider
      value={{
        isMaintenance,
        maintenanceMessage,
        isChecking,
        checkMaintenance,
        setManualMaintenance,
        isPreview,
        setPreview: setIsPreview,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  return useContext(MaintenanceContext);
}
