import { useState } from 'react';
import { ArrowRight, TrendingUp, AlertCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

interface Opportunity {
  id: string;
  poolA: {
    pool: { dexName: string; tokenA: string; tokenB: string; };
    tokenA: { symbol: string; };
    tokenB: { symbol: string; };
  };
  poolB: {
    pool: { dexName: string; };
  };
  tokenBorrow: string;
  tokenIntermediate: string;
  borrowAmount: string;
  expectedProfit: string;
  expectedProfitUsd: number;
  profitPercentage: number;
  timestamp: number;
}

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
  onExecute: () => void;
}

export default function OpportunitiesTable({ opportunities, onExecute }: OpportunitiesTableProps) {
  const [executing, setExecuting] = useState<string | null>(null);
  const { publicKey, isConnected, signTransaction } = useWallet();

  const handleExecute = async (oppId: string) => {
    // Check wallet connection
    if (!isConnected || !publicKey) {
      alert('Please connect your Freighter wallet first!');
      return;
    }

    console.log('Executing opportunity:', oppId);
    console.log('Current time:', Date.now());
    console.log('Opportunity timestamp from ID:', oppId.split('_').pop());
    
    setExecuting(oppId);
    try {
      // Request transaction from backend
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          opportunityId: oppId,
          userPublicKey: publicKey,
        }),
      });
      
      console.log('Execute response status:', response.status);
      console.log('Execute response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Execute error response:', errorText);
        
        // Parse error message
        let errorMsg = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error === 'Opportunity not found or expired') {
            errorMsg = '⏰ This opportunity has expired. Please refresh the page to see new opportunities.';
          } else {
            errorMsg = errorJson.error || errorText;
          }
        } catch {}
        
        alert(`Error: ${errorMsg}`);
        return;
      }
      
      const result = await response.json();
      console.log('Execute result:', result);
      
      if (result.requiresSignature && result.transactionXDR) {
        // Transaction built, now sign with Freighter
        console.log('Transaction XDR to sign:', result.transactionXDR);
        
        try {
          // Sign transaction with Freighter
          const signedXDR = await signTransaction(result.transactionXDR, 'Test SDF Network ; September 2015');
          console.log('Transaction signed successfully');
          
          // TODO: Submit signed transaction to Stellar network
          // const submitResponse = await fetch('/api/submit-transaction', {
          //   method: 'POST',
          //   body: JSON.stringify({ signedXDR })
          // });
          
          alert(`✅ Transaction Signed!\n\nProfit: $${result.opportunity.profit.toFixed(2)}\nPair: ${result.opportunity.pair}\n\n⚠️ Note: ${result.note}\n\n📝 Next step: Transaction submission to network (not yet implemented)`);
        } catch (signError) {
          console.error('Signing failed:', signError);
          alert(`❌ Transaction signing failed: ${(signError as Error).message}\n\nPossible reasons:\n- Freighter wallet locked\n- User rejected signature\n- Invalid transaction`);
        }
        
        onExecute();
      } else if (result.success) {
        alert('Arbitrage executed successfully!');
        onExecute();
      } else {
        alert(`Execution info: ${result.message || 'Check console for details'}`);
      }
    } catch (error) {
      console.error('Execute error:', error);
      alert('Execution error. See console for details.');
    } finally {
      setExecuting(null);
    }
  };

  const getRiskColor = (risk: string = 'MEDIUM') => {
    switch (risk.toUpperCase()) {
      case 'LOW':
        return 'text-green-400';
      case 'MEDIUM':
        return 'text-yellow-400';
      case 'HIGH':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  if (opportunities.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No arbitrage opportunities found</p>
        <p className="text-sm mt-2">Bot is scanning for profitable routes...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-slate-700">
          <tr className="text-left text-sm text-slate-400">
            <th className="pb-3 font-semibold">Route</th>
            <th className="pb-3 font-semibold">Amount</th>
            <th className="pb-3 font-semibold">Profit (BPS)</th>
            <th className="pb-3 font-semibold">Est. Profit</th>
            <th className="pb-3 font-semibold">AI Score</th>
            <th className="pb-3 font-semibold">Risk</th>
            <th className="pb-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opp) => {
            const borrowAmountFormatted = (parseFloat(opp.borrowAmount) / 1e7).toFixed(2);
            const profitBps = Math.round(opp.profitPercentage * 100);
            const profitFormatted = (parseFloat(opp.expectedProfit) / 1e7).toFixed(2);
            const aiScore = 0.84; // Mock AI score since not in data
            const risk = 'MEDIUM'; // Mock risk
            
            return (
              <tr 
                key={opp.id} 
                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm bg-slate-700 px-2 py-1 rounded">
                      {opp.tokenBorrow}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span className="font-mono text-sm bg-slate-700 px-2 py-1 rounded">
                      {opp.tokenIntermediate}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span className="font-mono text-sm bg-slate-700 px-2 py-1 rounded">
                      {opp.tokenBorrow}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {opp.poolA.pool.dexName} → {opp.poolB.pool.dexName}
                    <span className="ml-2 text-slate-500">
                      (Age: {Math.floor((Date.now() - opp.timestamp) / 1000)}s)
                    </span>
                  </div>
                </td>
                <td className="py-4 font-mono text-sm">{borrowAmountFormatted} {opp.tokenBorrow}</td>
                <td className="py-4">
                  <span className="text-green-400 font-semibold">
                    {profitBps} bps
                  </span>
                </td>
                <td className="py-4">
                  <span className="text-primary-400 font-semibold">
                    {profitFormatted} {opp.tokenBorrow}
                  </span>
                  <div className="text-xs text-slate-400 mt-1">
                    ${opp.expectedProfitUsd.toFixed(2)}
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-primary-400 h-2 rounded-full"
                        style={{ width: `${aiScore * 100}%` }}
                      />
                    </div>
                    <span className="text-sm">{(aiScore * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td className="py-4">
                  <span className={`text-sm font-semibold ${getRiskColor(risk)}`}>
                    {risk}
                  </span>
                </td>
                <td className="py-4">
                  <button
                    onClick={() => handleExecute(opp.id)}
                    disabled={executing === opp.id}
                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
                  >
                    {executing === opp.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Executing...</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        <span>Execute</span>
                      </>
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
