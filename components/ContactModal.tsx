import React, { useState } from 'react';
import { X, Send, Mail, User, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    website: '' // Honeypot
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to send message');
      }
      
      setStatus('success');
      setFormData({ name: '', email: '', message: '', website: '' });
    } catch (error: any) {
      console.error("Contact form error:", error);
      alert(`Error: ${error.message}`);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-[2rem] sm:rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 relative">
        <div className="p-6 sm:p-10 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-lg">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Contact Support</h2>
            <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Send us a message</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-10">
          {status === 'success' ? (
            <div className="py-12 text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-emerald-600/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Message Sent!</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                  We've received your transmission. <br /> Our team will respond shortly.
                </p>
              </div>
              <button 
                onClick={onClose}
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase text-xs transition-all active:scale-95"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot field - hidden from users */}
              <div className="hidden" aria-hidden="true">
                <input 
                  type="text" 
                  name="website" 
                  value={formData.website} 
                  onChange={e => setFormData({...formData, website: e.target.value})} 
                  tabIndex={-1} 
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-3 h-3" /> Name (Optional)
                </label>
                <input 
                  type="text"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                  placeholder="Your name..."
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Mail className="w-3 h-3 text-indigo-400" /> Email Address (Required)
                </label>
                <input 
                  required
                  type="email"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-3 h-3 text-amber-400" /> Message (Required)
                </label>
                <textarea 
                  required
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700 resize-none"
                  placeholder="How can we help?"
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {status === 'submitting' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {status === 'submitting' ? 'Sending...' : 'Send Message'}
              </button>
              
              <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest text-center">
                Sent to info@halfdozen.ca
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
