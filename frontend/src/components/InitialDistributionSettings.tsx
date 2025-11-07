import { useState } from 'react';
import { motion } from 'framer-motion';
import AdvancedSettings from './AdvancedSettings';
import { Users, Gift, UserPlus, X, Plus } from 'lucide-react';

export interface DistributionRecipient {
  address: string;
  amount: string;
  percentage?: number;
}

export interface InitialDistributionSettings {
  enabled: boolean;
  recipients: DistributionRecipient[];
  airdropEnabled: boolean;
  airdropAmount?: string;
  airdropRecipients?: string[]; // Comma-separated addresses
  teamAllocation?: string;
  teamVesting?: boolean;
  publicSale?: string;
  liquidityPool?: string;
}

interface InitialDistributionSettingsProps {
  settings: InitialDistributionSettings;
  onChange: (settings: InitialDistributionSettings) => void;
  totalSupply: string;
}

export default function InitialDistributionSettingsComponent({
  settings,
  onChange,
  totalSupply,
}: InitialDistributionSettingsProps) {
  const updateSetting = <K extends keyof InitialDistributionSettings>(
    key: K,
    value: InitialDistributionSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const addRecipient = () => {
    updateSetting('recipients', [
      ...settings.recipients,
      { address: '', amount: '', percentage: 0 },
    ]);
  };

  const removeRecipient = (index: number) => {
    updateSetting(
      'recipients',
      settings.recipients.filter((_, i) => i !== index)
    );
  };

  const updateRecipient = (index: number, field: keyof DistributionRecipient, value: string | number) => {
    const newRecipients = [...settings.recipients];
    newRecipients[index] = { ...newRecipients[index], [field]: value };
    
    // Calculate percentage if amount changed
    if (field === 'amount' && totalSupply && parseFloat(totalSupply) > 0) {
      const amount = parseFloat(value as string) || 0;
      newRecipients[index].percentage = (amount / parseFloat(totalSupply)) * 100;
    }
    
    updateSetting('recipients', newRecipients);
  };

  const totalAllocated = settings.recipients.reduce(
    (sum, r) => sum + (parseFloat(r.amount) || 0),
    0
  );
  const remainingPercentage = totalSupply
    ? ((parseFloat(totalSupply) - totalAllocated) / parseFloat(totalSupply)) * 100
    : 100;

  return (
    <div className="space-y-4">
      <AdvancedSettings
        title="Initial Distribution"
        description="Set up initial token distribution and allocations"
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <label className="font-semibold text-white">Enable Distribution</label>
                <p className="text-xs text-gray-400">Distribute tokens to specific addresses at launch</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('enabled', !settings.enabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                settings.enabled ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <motion.div
                className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-lg"
                animate={{ x: settings.enabled ? 28 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {settings.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {/* Recipients List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Recipients</label>
                  <button
                    onClick={addRecipient}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Recipient
                  </button>
                </div>

                {settings.recipients.map((recipient, index) => (
                  <div key={index} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-gray-300">Recipient #{index + 1}</span>
                      <button
                        onClick={() => removeRecipient(index)}
                        className="p-1 hover:bg-gray-700 rounded transition"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Address</label>
                        <input
                          type="text"
                          value={recipient.address}
                          onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                          placeholder="0x..."
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Amount</label>
                        <input
                          type="text"
                          value={recipient.amount}
                          onChange={(e) => updateRecipient(index, 'amount', e.target.value)}
                          placeholder="1000000"
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        />
                        {recipient.percentage !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            {recipient.percentage.toFixed(2)}% of supply
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Allocation Summary */}
                {settings.recipients.length > 0 && (
                  <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">Total Allocated</span>
                      <span className="text-sm font-semibold text-white">
                        {totalAllocated.toLocaleString()} ({totalAllocated > 0 && totalSupply ? ((totalAllocated / parseFloat(totalSupply)) * 100).toFixed(2) : 0}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Remaining</span>
                      <span className="text-sm font-semibold text-white">
                        {(parseFloat(totalSupply) - totalAllocated).toLocaleString()} ({remainingPercentage.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Team Allocation */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Allocation (%)
                </label>
                <input
                  type="text"
                  value={settings.teamAllocation || ''}
                  onChange={(e) => updateSetting('teamAllocation', e.target.value)}
                  placeholder="20"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="teamVesting"
                    checked={settings.teamVesting || false}
                    onChange={(e) => updateSetting('teamVesting', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600"
                  />
                  <label htmlFor="teamVesting" className="text-sm text-gray-400">
                    Enable vesting for team allocation
                  </label>
                </div>
              </div>

              {/* Public Sale */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Public Sale Allocation (%)
                </label>
                <input
                  type="text"
                  value={settings.publicSale || ''}
                  onChange={(e) => updateSetting('publicSale', e.target.value)}
                  placeholder="30"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Liquidity Pool */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Initial Liquidity Pool (%)
                </label>
                <input
                  type="text"
                  value={settings.liquidityPool || ''}
                  onChange={(e) => updateSetting('liquidityPool', e.target.value)}
                  placeholder="50"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </motion.div>
          )}
        </div>
      </AdvancedSettings>

      {/* Airdrop Settings */}
      <AdvancedSettings
        title="Airdrop Configuration"
        description="Set up token airdrops for community members"
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-purple-400" />
              <div>
                <label className="font-semibold text-white">Enable Airdrop</label>
                <p className="text-xs text-gray-400">Distribute tokens to multiple addresses</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('airdropEnabled', !settings.airdropEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                settings.airdropEnabled ? 'bg-purple-500' : 'bg-gray-600'
              }`}
            >
              <motion.div
                className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-lg"
                animate={{ x: settings.airdropEnabled ? 28 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {settings.airdropEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount per Address
                </label>
                <input
                  type="text"
                  value={settings.airdropAmount || ''}
                  onChange={(e) => updateSetting('airdropAmount', e.target.value)}
                  placeholder="1000"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recipient Addresses (one per line or comma-separated)
                </label>
                <textarea
                  value={settings.airdropRecipients?.join('\n') || ''}
                  onChange={(e) => {
                    const addresses = e.target.value
                      .split(/[,\n]/)
                      .map(a => a.trim())
                      .filter(a => a.length > 0);
                    updateSetting('airdropRecipients', addresses);
                  }}
                  placeholder="0x1234...\n0x5678...\n0x9abc..."
                  rows={6}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                />
                {settings.airdropRecipients && settings.airdropRecipients.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {settings.airdropRecipients.length} addresses configured
                  </p>
                )}
              </div>
              {settings.airdropAmount && settings.airdropRecipients && settings.airdropRecipients.length > 0 && (
                <div className="p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                  <p className="text-sm text-gray-300">
                    Total Airdrop: {(parseFloat(settings.airdropAmount) * settings.airdropRecipients.length).toLocaleString()} tokens
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </AdvancedSettings>
    </div>
  );
}





