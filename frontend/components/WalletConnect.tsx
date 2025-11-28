'use client';

import { useWallet } from '@/contexts/WalletContext';
import { Wallet, LogOut, ExternalLink } from 'lucide-react';

export default function WalletConnect() {
  const { publicKey, isConnected, isFreighterInstalled, connect, disconnect } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  if (!isFreighterInstalled) {
    return (
      <button
        onClick={handleConnect}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        <ExternalLink className="h-4 w-4" />
        Install Freighter
      </button>
    );
  }

  if (isConnected && publicKey) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-600/30 rounded-lg">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <Wallet className="h-4 w-4 text-green-600" />
          <span className="text-sm font-mono text-green-600">
            {formatAddress(publicKey)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="p-2 hover:bg-red-600/10 text-red-600 rounded-lg transition-colors"
          title="Disconnect Wallet"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </button>
  );
}
