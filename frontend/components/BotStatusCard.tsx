import { Activity, AlertCircle, CheckCircle, Pause } from 'lucide-react';

interface BotStatusCardProps {
  status: any;
}

export default function BotStatusCard({ status }: BotStatusCardProps) {
  const isRunning = status?.isRunning || false;
  const lastScan = status?.lastScanTime || 'Never';
  const uptime = status?.uptime || '0h 0m';

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl border border-slate-600 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Bot Status</h3>
        {isRunning ? (
          <CheckCircle className="w-5 h-5 text-green-400 animate-pulse" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-400" />
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Status:</span>
          <span className={`font-semibold ${isRunning ? 'text-green-400' : 'text-red-400'}`}>
            {isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Uptime:</span>
          <span className="font-mono text-sm">{uptime}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Last Scan:</span>
          <span className="font-mono text-sm">{lastScan}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Network:</span>
          <span className="font-semibold text-primary-400">
            {status?.network || 'Testnet'}
          </span>
        </div>
      </div>
    </div>
  );
}
