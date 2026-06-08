
import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthPageProps {
  onLogin: (username: string, role: 'user' | 'general_admin', isRegister?: boolean, password?: string) => Promise<void>;
  t: (key: string) => string;
  onBack?: () => void;
}

export const AuthPage = ({ onLogin, t, onBack }: AuthPageProps) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isRegister && formData.password !== formData.confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    
    if (!formData.username || !formData.password) {
      setError(t('fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const role = isAdminLogin ? 'general_admin' : 'user';
      // Pass the password and register flag to the parent handler
      // Note: The parent handler signature in App.tsx might need update or we handle API call here?
      // For consistency with current architecture, we'll assume onLogin handles the API interaction
      // BUT current onLogin in App.tsx takes (role). We need to refactor App.tsx to accept credentials.
      // Let's assume we will update App.tsx to match this signature:
      // onLogin(username, password, isRegister, role)
      
      // Wait, the prop defined above is `onLogin: (username, role, isRegister)`.
      // We need to pass password too. Let's update the interface.
      // Actually, let's just pass the data object or have this component handle the service call?
      // Better to keep logic in App.tsx or services.
      
      // Let's just use a custom event or callback that passes everything
      await onLogin(formData.username, role, isRegister, formData.password); 
    } catch (err: any) {
      setError(err.message || t('authFailed'));
    } finally {
      setLoading(false);
    }
  };

  // If Admin login is selected, force Login mode (no register for admin)
  const toggleAdmin = () => {
    setIsAdminLogin(!isAdminLogin);
    setIsRegister(false);
    setError('');
    setFormData({ username: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-slate opacity-[0.4] pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-3xl"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden relative z-10"
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-white/80 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-white transition-colors flex items-center justify-center"
            aria-label="返回浏览"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className={`h-2 bg-gradient-to-r ${isAdminLogin ? 'from-purple-500 to-indigo-600' : 'from-blue-500 to-cyan-500'}`}></div>
        
        <div className="p-8">
          <div className="text-center mb-8">
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-lg transition-colors ${isAdminLogin ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}`}>
              {isAdminLogin ? <ShieldCheck className="w-8 h-8" /> : <User className="w-8 h-8" />}
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              {isAdminLogin ? t('adminPortal') : (isRegister ? t('createAccount') : t('welcomeBack'))}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              {isAdminLogin ? t('restrictedAccess') : t('accessPlatform')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">{t('username')}</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder={t('username')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">{t('password')}</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <AnimatePresence>
              {isRegister && !isAdminLogin && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4">
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">{t('confirmPassword')}</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input 
                        type="password"
                        value={formData.confirmPassword}
                        onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isAdminLogin ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-purple-500/30' : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-blue-500/30'} disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegister ? t('createAccount') : t('signIn')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-between text-sm">
            {!isAdminLogin ? (
              <button 
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className="text-slate-500 hover:text-blue-600 font-medium transition-colors"
              >
                {isRegister ? t('alreadyHaveAccount') : t('needAccount')}
              </button>
            ) : (
              <div className="text-slate-400 italic text-xs">{t('adminRegistrationDisabled')}</div>
            )}
            
            <button 
              onClick={toggleAdmin}
              className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${isAdminLogin ? 'bg-purple-50 text-purple-600 border-purple-200' : 'text-slate-400 border-transparent hover:bg-slate-100'}`}
            >
              {isAdminLogin ? t('userLogin') : t('adminPortal')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
