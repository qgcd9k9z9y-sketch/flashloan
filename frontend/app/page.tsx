'use client';

import { useEffect, useState } from 'react';
import { Activity, TrendingUp, DollarSign, Zap, AlertTriangle } from 'lucide-react';
import BotStatusCard from '@/components/BotStatusCard';
import MetricsOverview from '@/components/MetricsOverview';
import OpportunitiesTable from '@/components/OpportunitiesTable';
import ProfitChart from '@/components/ProfitChart';
import BotControls from '@/components/BotControls';
import WalletConnect from '@/components/WalletConnect';

export default function Home() {
  const [botStatus, setBotStatus] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch bot status
      const statusRes = await fetch('/api/bot/status');
      if (statusRes.ok) {
        const status = await statusRes.json();
        setBotStatus(status);
      }

      // Fetch opportunities
      const oppRes = await fetch('/api/opportunities');
      if (oppRes.ok) {
        const opps = await oppRes.json();
        setOpportunities(opps);
      }

      // Fetch metrics
      const metricsRes = await fetch('/api/metrics');
      if (metricsRes.ok) {
        const m = await metricsRes.json();
        setMetrics(m);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="w-8 h-8 text-primary-400" />
              <div>
                <h1 className="text-2xl font-bold">Flash Loan Arbitrage Bot</h1>
                <p className="text-sm text-slate-400">Stellar Soroban Ecosystem</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <WalletConnect />
              <BotControls botStatus={botStatus} onRefresh={fetchData} />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Status and Key Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BotStatusCard status={botStatus} />
          <MetricsOverview metrics={metrics} />
        </div>

        {/* Profit Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary-400" />
            Profit History
          </h2>
          <ProfitChart data={metrics?.profitHistory || []} />
        </div>

        {/* Opportunities Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-primary-400" />
            Active Opportunities ({opportunities.length})
          </h2>
          <OpportunitiesTable opportunities={opportunities} onExecute={fetchData} />
        </div>

        {/* Footer */}
        <footer className="text-center text-slate-400 text-sm py-4">
          <p>Flash Loan Arbitrage Bot v1.0.0 | Stellar Soroban</p>
        </footer>
      </div>
    </main>
  );
}
