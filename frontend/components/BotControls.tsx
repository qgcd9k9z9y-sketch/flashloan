import { useState } from 'react';
import { Play, Pause, RefreshCw, Settings } from 'lucide-react';

interface BotControlsProps {
  botStatus: any;
  onRefresh: () => void;
}

export default function BotControls({ botStatus, onRefresh }: BotControlsProps) {
  const [loading, setLoading] = useState(false);
  const isRunning = botStatus?.isRunning || false;

  const handleToggleBot = async () => {
    setLoading(true);
    try {
      const endpoint = isRunning ? '/api/bot/stop' : '/api/bot/start';
      const response = await fetch(endpoint, { method: 'POST' });
      
      if (response.ok) {
        setTimeout(() => {
          onRefresh();
          setLoading(false);
        }, 1000);
      } else {
        alert('Failed to toggle bot');
        setLoading(false);
      }
    } catch (error) {
      console.error('Toggle error:', error);
      alert('Error toggling bot');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={onRefresh}
        disabled={loading}
        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 transition-colors"
        title="Refresh"
      >
        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
      </button>

      <button
        onClick={handleToggleBot}
        disabled={loading}
        className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2 ${
          isRunning
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-green-600 hover:bg-green-700'
        } disabled:opacity-50`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            <span>Loading...</span>
          </>
        ) : isRunning ? (
          <>
            <Pause className="w-5 h-5" />
            <span>Stop Bot</span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            <span>Start Bot</span>
          </>
        )}
      </button>

      <button
        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  );
}
