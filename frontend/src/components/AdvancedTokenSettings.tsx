import { useState } from 'react';
import { Settings, Zap, Shield, Lock, Users, AlertTriangle } from 'lucide-react';

export interface AdvancedTokenSettings {
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
  blacklistEnabled: boolean;
  whitelistEnabled: boolean;
  transferRestrictions: boolean;
  transferTaxEnabled: boolean;
  governanceEnabled: boolean;
  vestingEnabled: boolean;
  multiSigEnabled: boolean;
  timelockEnabled: boolean;
}

interface AdvancedTokenSettingsProps {
  settings: AdvancedTokenSettings;
  onChange: (settings: AdvancedTokenSettings) => void;
}

export default function AdvancedTokenSettingsComponent({
  settings,
  onChange,
}: AdvancedTokenSettingsProps) {
  const updateSetting = (key: keyof AdvancedTokenSettings, value: boolean) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  const features = [
    {
      key: 'mintable' as const,
      title: 'Mintable',
      description: 'Allow additional tokens to be minted after creation',
      icon: Zap,
      color: 'from-yellow-500 to-orange-600',
    },
    {
      key: 'burnable' as const,
      title: 'Burnable',
      description: 'Allow tokens to be permanently destroyed (burned)',
      icon: AlertTriangle,
      color: 'from-red-500 to-pink-600',
    },
    {
      key: 'pausable' as const,
      title: 'Pausable',
      description: 'Allow token transfers to be paused in emergencies',
      icon: Shield,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      key: 'blacklistEnabled' as const,
      title: 'Blacklist',
      description: 'Enable blacklist functionality to block specific addresses',
      icon: Lock,
      color: 'from-gray-500 to-gray-700',
    },
    {
      key: 'whitelistEnabled' as const,
      title: 'Whitelist',
      description: 'Restrict transfers to only whitelisted addresses',
      icon: Users,
      color: 'from-green-500 to-emerald-600',
    },
    {
      key: 'transferRestrictions' as const,
      title: 'Transfer Restrictions',
      description: 'Add custom transfer restrictions and limits',
      icon: Shield,
      color: 'from-purple-500 to-pink-600',
    },
    {
      key: 'transferTaxEnabled' as const,
      title: 'Transfer Tax',
      description: 'Enable tax on token transfers',
      icon: Settings,
      color: 'from-orange-500 to-red-600',
    },
    {
      key: 'governanceEnabled' as const,
      title: 'Governance',
      description: 'Enable governance features for token holders',
      icon: Users,
      color: 'from-indigo-500 to-blue-600',
    },
    {
      key: 'vestingEnabled' as const,
      title: 'Vesting',
      description: 'Enable token vesting schedules for team/advisors',
      icon: Lock,
      color: 'from-teal-500 to-cyan-600',
    },
    {
      key: 'multiSigEnabled' as const,
      title: 'Multi-Signature',
      description: 'Require multiple signatures for critical operations',
      icon: Shield,
      color: 'from-purple-500 to-indigo-600',
    },
    {
      key: 'timelockEnabled' as const,
      title: 'Timelock',
      description: 'Add time delays to administrative actions',
      icon: Lock,
      color: 'from-red-500 to-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Advanced Token Settings</h3>
          <p className="text-gray-400 text-sm">Configure advanced features for your token</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isEnabled = settings[feature.key];

          return (
            <label
              key={feature.key}
              className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isEnabled
                  ? 'bg-gray-800/80 border-primary-500/50 shadow-lg shadow-primary-500/20'
                  : 'bg-gray-800/40 border-gray-700/50 hover:border-gray-600/50'
              }`}
            >
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => updateSetting(feature.key, e.target.checked)}
                className="sr-only"
              />
              <div className={`flex-shrink-0 p-2 bg-gradient-to-br ${feature.color} rounded-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-white">{feature.title}</h4>
                  <div
                    className={`flex-shrink-0 w-10 h-5 rounded-full transition-colors ${
                      isEnabled ? 'bg-primary-500' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            </label>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-400 mb-1">Note</p>
            <p className="text-xs text-gray-300">
              Advanced features may require additional gas costs and smart contract complexity. 
              Some features are not yet available on all chains. Please review each feature carefully 
              before enabling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

