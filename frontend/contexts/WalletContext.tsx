'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';

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

  const connect = () => {
    showConnect({
      appDetails: {
        name: 'DeFi Lending Protocol',
        icon: '/logo.png',
      },
      onFinish: () => {
        if (userSession) {
          const userData = userSession.loadUserData();
          setIsConnected(true);
          setAddress(userData.profile.stxAddress.mainnet);
        }
      },
      userSession,
    });
  };

  const disconnect = () => {
    if (userSession) {
      userSession.signUserOut();
      setIsConnected(false);
      setAddress(null);
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
