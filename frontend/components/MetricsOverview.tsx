import { DollarSign, TrendingUp, AlertTriangle, Activity } from 'lucide-react';

interface MetricsOverviewProps {
  metrics: any;
}

export default function MetricsOverview({ metrics }: MetricsOverviewProps) {
  const totalProfit = metrics?.totalProfit || '0.00';
  const successRate = metrics?.successRate || '0.0';
  const totalExecutions = metrics?.totalExecutions || 0;
  const avgProfit = metrics?.avgProfit || '0.00';

  return (
    <>
      {/* Total Profit Card */}
      <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl border border-green-700/50 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Total Profit</h3>
          <DollarSign className="w-5 h-5 text-green-400" />
        </div>
        
        <div className="space-y-2">
          <div className="text-3xl font-bold text-green-400">
            {totalProfit} XLM
          </div>
          <div className="text-sm text-slate-400">
            Avg: {avgProfit} XLM per trade
          </div>
        </div>
      </div>

      {/* Performance Card */}
      <div className="bg-gradient-to-br from-primary-900/30 to-primary-800/30 rounded-xl border border-primary-700/50 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Performance</h3>
          <Activity className="w-5 h-5 text-primary-400" />
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Success Rate:</span>
            <span className="font-bold text-primary-400">{successRate}%</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Executions:</span>
            <span className="font-semibold">{totalExecutions}</span>
          </div>
          
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-primary-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
