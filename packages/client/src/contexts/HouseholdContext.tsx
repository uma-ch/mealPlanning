import { createContext, useContext, ReactNode } from 'react';

interface Household {
  id: string;
  name: string;
  inviteCode: string;
}

interface HouseholdContextType {
  household: Household | null;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  // TODO: Fetch household data
  const household = null;

  return (
    <HouseholdContext.Provider value={{ household }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error('useHousehold must be used within HouseholdProvider');
  }
  return context;
}
