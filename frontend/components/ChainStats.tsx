import { Globe } from 'lucide-react';

interface ChainStatsProps {
  opportunities: any[];
}

export default function ChainStats({ opportunities }: ChainStatsProps) {
  // Group opportunities by chain
  const chainCounts = opportunities.reduce((acc: Record<string, number>, opp) => {
    const dexName = opp.poolA?.pool?.dexName || 'Unknown';
    let chain = 'Unknown';
    
    if (['Soroswap', 'Aquarius'].includes(dexName)) chain = 'Stellar';
    else if (['Aerodrome', 'BaseSwap'].includes(dexName)) chain = 'Base';
    else if (['Raydium', 'Orca'].includes(dexName)) chain = 'Solana';
    else if (['Cetus', 'Turbos'].includes(dexName)) chain = 'Sui';
    else if (['PancakeSwap', 'Liquidswap'].includes(dexName)) chain = 'Aptos';
    
    acc[chain] = (acc[chain] || 0) + 1;
    return acc;
  }, {});

  const chains = [
    { name: 'Stellar', emoji: '⭐', color: 'from-blue-500 to-purple-500', count: chainCounts['Stellar'] || 0 },
    { name: 'Base', emoji: '🔵', color: 'from-blue-600 to-blue-400', count: chainCounts['Base'] || 0 },
    { name: 'Solana', emoji: '🟣', color: 'from-purple-600 to-pink-500', count: chainCounts['Solana'] || 0 },
    { name: 'Sui', emoji: '🌊', color: 'from-cyan-500 to-blue-500', count: chainCounts['Sui'] || 0 },
    { name: 'Aptos', emoji: '🔴', color: 'from-red-500 to-pink-500', count: chainCounts['Aptos'] || 0 },
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Globe className="w-5 h-5 mr-2 text-primary-400" />
        Multi-Chain Coverage
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {chains.map((chain) => (
          <div 
            key={chain.name}
            className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-4 border border-slate-600/50 hover:border-primary-500/50 transition-all"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{chain.emoji}</div>
              <div className="text-sm font-semibold text-slate-300 mb-1">{chain.name}</div>
              <div className="text-2xl font-bold text-primary-400">{chain.count}</div>
              <div className="text-xs text-slate-400 mt-1">
                {chain.count === 1 ? 'opportunity' : 'opportunities'}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Total Active Chains:</span>
          <span className="font-bold text-primary-400">
            {chains.filter(c => c.count > 0).length} / 5
          </span>
        </div>
      </div>
    </div>
  );
}
