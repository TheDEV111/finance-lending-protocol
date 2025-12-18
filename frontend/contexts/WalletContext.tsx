'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfig, UserSession, openAuthRequest } from '@stacks/connect';

interface WalletContextType {
  userSession: UserSession | null;
  isConnected: boolean;
  address: string | null;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  userSession: null,
  isConnected: false,
  address: null,
  connect: () => {},
  disconnect: () => {},
});

const appConfig = new AppConfig(['store_write', 'publish_data']);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const session = new UserSession({ appConfig });
    setUserSession(session);

    if (session.isUserSignedIn()) {
      const userData = session.loadUserData();
      setIsConnected(true);
      setAddress(userData.profile.stxAddress.mainnet);
    }
  }, []);

  const connect = async () => {
    if (!userSession) return;

    try {
      await openAuthRequest({
        appDetails: {
          name: 'DeFi Lending Protocol',
          icon: window.location.origin + '/logo.png',
        },
        onFinish: () => {
          // Reload to pick up the session
          window.location.reload();
        },
        userSession,
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnect = () => {
    if (userSession) {
      userSession.signUserOut(window.location.origin);
      setIsConnected(false);
      setAddress(null);
      window.location.reload();
    }
  };

  return (
    <WalletContext.Provider
      value={{
        userSession,
        isConnected,
        address,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
