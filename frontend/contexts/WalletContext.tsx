'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as freighter from '@stellar/freighter-api';

interface WalletContextType {
  publicKey: string | null;
  isConnected: boolean;
  isFreighterInstalled: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string, networkPassphrase: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isFreighterInstalled, setIsFreighterInstalled] = useState(false);

  useEffect(() => {
    // Check if Freighter is installed
    const checkFreighter = async () => {
      const result = await freighter.isConnected();
      setIsFreighterInstalled(result.isConnected);
      
      if (result.isConnected) {
        // Check if already connected
        const allowedResult = await freighter.isAllowed();
        if (allowedResult.isAllowed) {
          try {
            const addressResult = await freighter.getAddress();
            if (addressResult.address) {
              setPublicKey(addressResult.address);
              setIsWalletConnected(true);
            }
          } catch (error) {
            console.error('Failed to get address:', error);
          }
        }
      }
    };

    checkFreighter();
  }, []);

  const connect = async () => {
    try {
      if (!isFreighterInstalled) {
        window.open('https://www.freighter.app/', '_blank');
        return;
      }

      // Request access
      await freighter.setAllowed();
      
      // Get address
      const addressResult = await freighter.getAddress();
      if (addressResult.address) {
        setPublicKey(addressResult.address);
        setIsWalletConnected(true);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnect = () => {
    setPublicKey(null);
    setIsWalletConnected(false);
  };

  const signTx = async (xdr: string, networkPassphrase: string): Promise<string> => {
    try {
      const result = await freighter.signTransaction(xdr, {
        networkPassphrase,
      });
      
      if (result.signedTxXdr) {
        return result.signedTxXdr;
      }
      
      throw new Error('Failed to sign transaction');
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      throw error;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        isConnected: isWalletConnected,
        isFreighterInstalled,
        connect,
        disconnect,
        signTransaction: signTx,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
