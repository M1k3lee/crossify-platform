import { Link } from 'react-router-dom';
import { Mail, Twitter, MessageCircle, Github, FileText, Shield, HelpCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gray-900/95 backdrop-blur-lg border-t border-gray-800/50 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Crossify.io
              </span>
            </Link>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              Launch your token across multiple chains with unified liquidity and cross-chain price synchronization.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/crossify"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 hover:bg-primary-600 rounded-lg transition-colors group"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a
                href="https://discord.gg/crossify"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 hover:bg-indigo-600 rounded-lg transition-colors group"
                aria-label="Discord"
              >
                <MessageCircle className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a
                href="https://github.com/crossify"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2">
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2">
                  <span>Marketplace</span>
                </Link>
              </li>
              <li>
                <Link to="/builder" className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2">
                  <span>Launch Token</span>
                </Link>
              </li>
              <li>
                <Link to="/airdrop" className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2">
                  <span>Airdrop</span>
                </Link>
              </li>
              <li>
                <Link to="/presale" className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2">
                  <span>Presale</span>
                </Link>
              </li>
              <li>
                <Link to="/tokenomics" className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2">
                  <span>Tokenomics</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal & Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Contact Us</span>
                </Link>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Terms of Service</span>
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Privacy Policy</span>
                </a>
              </li>
              <li>
                <a
                  href="/faq"
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>FAQ</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Documentation</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/crossify/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <Link
                  to="/whitepaper"
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Whitepaper</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/tokenomics"
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Tokenomics</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800/50 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {currentYear} Crossify.io. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-500">Currently on Testnet</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <span className="text-yellow-400">Mainnet Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

