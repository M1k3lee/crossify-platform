import { Twitter, Share2, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface TokenShareButtonProps {
  tokenName: string;
  tokenSymbol: string;
  tokenUrl: string;
  tokenImage?: string | null;
  price?: string;
  chains?: string[];
}

export default function TokenShareButton({
  tokenName,
  tokenSymbol,
  tokenUrl,
  tokenImage,
  price,
  chains = [],
}: TokenShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const generateShareText = () => {
    const chainText = chains.length > 0 
      ? `🚀 Live on ${chains.slice(0, 3).join(', ')}${chains.length > 3 ? ` +${chains.length - 3} more` : ''}`
      : '🚀';
    
    const priceText = price ? `💰 Price: ${price}` : '';
    
    return `🔥 ${tokenName} (${tokenSymbol}) is LIVE on Crossify!\n\n${chainText}\n${priceText}\n\nTrade now: ${tokenUrl}\n\n#DeFi #Crypto #TokenLaunch #Crossify`;
  };

  const handleShareX = () => {
    const text = generateShareText();
    const encodedText = encodeURIComponent(text);
    const url = `https://twitter.com/intent/tweet?text=${encodedText}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(tokenUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tokenName} (${tokenSymbol}) on Crossify`,
          text: generateShareText(),
          url: tokenUrl,
        });
      } catch (error: any) {
        // User cancelled or error occurred
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback to copy
      handleCopyLink();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Shill It Button - Primary */}
      <button
        onClick={handleShareX}
        className="group relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <Twitter className="w-4 h-4" />
        <span>Shill It</span>
      </button>

      {/* Share Menu */}
      <div className="relative group">
        <button
          onClick={handleNativeShare}
          className="p-2 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 rounded-lg transition-colors"
          title="Share"
        >
          <Share2 className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className="p-2 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 rounded-lg transition-colors"
        title="Copy link"
      >
        {copied ? (
          <CheckCircle className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-gray-300" />
        )}
      </button>
    </div>
  );
}

