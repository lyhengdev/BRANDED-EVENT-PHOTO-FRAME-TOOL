import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, KeyRound, ShieldAlert, Check, X, ShieldCheck, HelpCircle } from 'lucide-react';
import { sound } from '../utils/soundEffects';

export default function ConsoleAuthModal({ isOpen, onClose, onSuccess }) {
  const [username, setUsername] = useState('admin');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unlockedState, setUnlockedState] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const passInputRef = useRef(null);

  // CRITICAL: Cleanly reset all state whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setUsername('admin');
      setPasscode('');
      setError('');
      setLoading(false);
      setUnlockedState(false);
      setTimeout(() => {
        passInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeypadPress = (val) => {
    sound.playMechanicalClick();
    if (val === 'CLEAR') {
      setPasscode('');
      setError('');
    } else if (val === 'BACK') {
      setPasscode(prev => prev.slice(0, -1));
      setError('');
    } else {
      if (passcode.length < 16) {
        setPasscode(prev => prev + val);
        setError('');
      }
    }
  };

  const handleAuthorize = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError('');

    const trimmedUser = (username || '').trim();
    const trimmedPass = (passcode || '').trim();

    if (!trimmedUser) {
      setError('Please enter operator username');
      sound.playMechanicalClick();
      return;
    }

    if (!trimmedPass) {
      setError('Please enter operator passcode (e.g. 2026)');
      sound.playMechanicalClick();
      passInputRef.current?.focus();
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUser, passcode: trimmedPass })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sound.playShutterSound();
        setUnlockedState(true);
        localStorage.setItem('framecraft_admin_token', data.token);

        setTimeout(() => {
          onSuccess(data.user);
          setUnlockedState(false);
          setPasscode('');
          setLoading(false);
        }, 500);
      } else {
        sound.playMechanicalClick();
        setError(data.error || 'Access Denied: Invalid credentials');
        setPasscode('');
        setLoading(false);
        passInputRef.current?.focus();
      }
    } catch (err) {
      sound.playMechanicalClick();
      setError('Connection failure: ' + err.message);
      setLoading(false);
    }
  };

  const handleClose = () => {
    sound.playMechanicalClick();
    setPasscode('');
    setError('');
    setLoading(false);
    setUnlockedState(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(4, 6, 12, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            x: error ? [-6, 6, -4, 4, 0] : 0 
          }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="camera-chassis"
          style={{
            width: '100%',
            maxWidth: 420,
            padding: '28px 24px',
            position: 'relative',
            border: unlockedState ? '1px solid #10b981' : undefined
          }}
        >
          {/* Security Chassis Screws */}
          <div className="chassis-screw" style={{ top: 12, left: 12 }} />
          <div className="chassis-screw" style={{ top: 12, right: 12 }} />
          <div className="chassis-screw" style={{ bottom: 12, left: 12 }} />
          <div className="chassis-screw" style={{ bottom: 12, right: 12 }} />

          {/* Cancel / Abort Button */}
          <button
            type="button"
            onClick={handleClose}
            className="btn-tactile btn-tactile-icon"
            style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32 }}
          >
            <X size={15} />
          </button>

          {/* Top Security Status Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            {/* Physical Keyhole Lock Jewel */}
            <div style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              margin: '0 auto 12px',
              background: unlockedState 
                ? 'radial-gradient(circle at 35% 35%, #059669 0%, #064e3b 85%)'
                : 'radial-gradient(circle at 35% 35%, #475569 0%, #1e293b 60%, #090d16 100%)',
              border: `2px solid ${unlockedState ? '#34d399' : 'rgba(255, 255, 255, 0.25)'}`,
              boxShadow: unlockedState ? '0 0 25px rgba(16, 185, 129, 0.6)' : '0 6px 16px rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}>
              {unlockedState ? (
                <Unlock size={26} color="#ffffff" />
              ) : (
                <Lock size={26} color="#f87171" />
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
              <span className={`led-jewel ${unlockedState ? 'led-green' : 'led-amber'}`} />
              <h2 className="engraved-light" style={{ fontSize: '1.25rem' }}>
                {unlockedState ? 'SECURITY CLEARED' : 'RESTRICTED CONSOLE'}
              </h2>
            </div>
            <p className="engraved-text" style={{ fontSize: '0.68rem', color: '#64748b' }}>
              LEVEL 4 OPERATOR CLEARANCE REQUIRED
            </p>
          </div>

          {/* LCD Digital Passcode Display */}
          <div style={{
            background: '#070a13',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            boxShadow: 'var(--recessed-inner)',
            border: '1px solid rgba(0,0,0,0.9)',
            marginBottom: 16,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>
              SECURITY PASSCODE DIGITS
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.5rem',
              letterSpacing: '0.3em',
              color: error ? '#f87171' : unlockedState ? '#34d399' : '#38bdf8',
              minHeight: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {passcode ? '•'.repeat(passcode.length) : <span style={{ opacity: 0.3, fontSize: '0.9rem' }}>ENTER PASSCODE</span>}
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleAuthorize} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="engraved-text" style={{ display: 'block', fontSize: '0.65rem', marginBottom: 4 }}>
                OPERATOR USERNAME
              </label>
              <input
                type="text"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                required
              />
            </div>

            <div>
              <label className="engraved-text" style={{ display: 'block', fontSize: '0.65rem', marginBottom: 4 }}>
                KEYPAD / KEYBOARD PASSCODE
              </label>
              <input
                ref={passInputRef}
                type="password"
                className="input"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••"
                style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}
                required
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            {/* Tactile Numeric Keypad */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginTop: 4
            }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'BACK'].map((btn) => (
                <button
                  key={btn}
                  type="button"
                  onClick={() => handleKeypadPress(btn)}
                  className="btn-tactile"
                  style={{
                    padding: '10px 0',
                    fontSize: btn.length > 1 ? '0.7rem' : '1.1rem',
                    fontFamily: 'var(--font-mono)',
                    color: btn === 'CLEAR' ? '#f87171' : btn === 'BACK' ? '#fbbf24' : '#f8fafc'
                  }}
                >
                  {btn}
                </button>
              ))}
            </div>

            {/* Authorize Master Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-tactile"
              style={{
                marginTop: 8,
                background: unlockedState 
                  ? 'linear-gradient(180deg, #059669 0%, #047857 100%)' 
                  : 'linear-gradient(180deg, #4338ca 0%, #312e81 60%, #1e1b4b 100%)',
                color: '#fff',
                padding: '12px',
                fontSize: '0.95rem',
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              {unlockedState ? (
                <>
                  <Check size={18} />
                  <span>ACCESS AUTHORIZED</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>{loading ? 'VERIFYING CREDENTIALS...' : 'AUTHORIZE CONSOLE ACCESS'}</span>
                </>
              )}
            </button>
          </form>

          {/* Credentials Helper Pill */}
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="btn-ghost"
              style={{ fontSize: '0.75rem', color: '#94a3b8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <HelpCircle size={14} />
              <span>{showHint ? 'Default credentials:' : 'Default credentials hint'}</span>
            </button>
            {showHint && (
              <div style={{
                marginTop: 6,
                fontSize: '0.75rem',
                color: '#38bdf8',
                background: '#090c14',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                display: 'inline-block',
                fontFamily: 'var(--font-mono)'
              }}>
                User: <strong>admin</strong> • Passcode: <strong>2026</strong> (or <strong>frame2026</strong>)
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
