import { useState } from 'react';
import { Mail, Send, MessageSquare, User, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import QuantumBackground from '../components/QuantumBackground';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');
      await axios.post(`${API_BASE}/contact`, formData);
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      console.error('Contact form error:', error);
      
      // Check if it's a 405 (backend not deployed) or network error
      if (error.response?.status === 405 || error.code === 'ERR_NETWORK' || error.message?.includes('405')) {
        // Fallback: Open email client with pre-filled message
        const emailSubject = encodeURIComponent(formData.subject || 'Contact Form Submission');
        const emailBody = encodeURIComponent(
          `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
        );
        const mailtoLink = `mailto:webapp@crossify.io?subject=${emailSubject}&body=${emailBody}`;
        
        toast.error('Backend service is not available. Opening email client...', { duration: 5000 });
        
        // Open email client after a short delay
        setTimeout(() => {
          window.location.href = mailtoLink;
        }, 500);
      } else {
        toast.error(error.response?.data?.error || 'Failed to send message. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        <QuantumBackground />
        <div className="relative z-10 max-w-2xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-12 border border-gray-700/50 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-block mb-6"
            >
              <div className="p-4 bg-green-500/20 rounded-full border border-green-500/50">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-4">Message Sent!</h2>
            <p className="text-gray-300 mb-6">
              Thank you for contacting us. We've received your message and will get back to you as soon as possible.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
            >
              Send Another Message
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
      <QuantumBackground />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-blue-600 blur-2xl opacity-50 rounded-full" />
              <div className="relative p-4 bg-gradient-to-br from-primary-500/20 to-blue-600/20 backdrop-blur-sm rounded-full border border-primary-500/50">
                <Mail className="w-12 h-12 text-primary-400" />
              </div>
            </div>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Get In Touch
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="p-3 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl w-fit mb-4">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Email</h3>
              <a
                href="mailto:webapp@crossify.io"
                className="text-primary-400 hover:text-primary-300 transition-colors text-sm break-all"
              >
                webapp@crossify.io
              </a>
              <p className="text-gray-500 text-xs mt-2">
                Click to send email directly
              </p>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl w-fit mb-4">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Response Time</h3>
              <p className="text-gray-400 text-sm">
                We typically respond within 24-48 hours during business days.
              </p>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl w-fit mb-4">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Support</h3>
              <p className="text-gray-400 text-sm">
                For technical support, please include as much detail as possible about your issue.
              </p>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2"
          >
            <form onSubmit={handleSubmit} className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="partnership">Partnership</option>
                  <option value="presale">Presale Information</option>
                  <option value="airdrop">Airdrop Questions</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Tell us how we can help..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}




