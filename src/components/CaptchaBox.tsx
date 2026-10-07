import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, Volume2, ShieldCheck, AlertCircle } from 'lucide-react';

interface CaptchaBoxProps {
  value: string;
  onChange: (val: string) => void;
  onValidChange?: (isValid: boolean) => void;
  error?: string;
  idPrefix?: string;
}

// Alphanumeric pool omitting ambiguous characters (0, O, 1, I, l)
const CHAR_SET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const CaptchaBox: React.FC<CaptchaBoxProps> = ({
  value,
  onChange,
  onValidChange,
  error,
  idPrefix = 'captcha',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Generate a random 6-character code
  const generateNewCaptcha = useCallback(() => {
    let result = '';
    for (let i = 0; i < 6; i++) {
      const idx = Math.floor(Math.random() * CHAR_SET.length);
      result += CHAR_SET[idx];
    }
    setCaptchaCode(result);
    onChange('');
  }, [onChange]);

  // Render canvas with distortion, noise lines, and dots
  const drawCaptcha = useCallback((code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.5, '#1e1b4b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle background grid
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let x = 0; x < width; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Noise dots
    for (let i = 0; i < 45; i++) {
      ctx.fillStyle = `rgba(${150 + Math.random() * 105}, ${150 + Math.random() * 105}, 255, ${0.2 + Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Criss-cross noise lines
    const lineColors = ['rgba(99, 102, 241, 0.5)', 'rgba(236, 72, 153, 0.4)', 'rgba(45, 212, 191, 0.4)'];
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = lineColors[i % lineColors.length];
      ctx.lineWidth = 1 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 15, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height,
        width - Math.random() * 15,
        Math.random() * height
      );
      ctx.stroke();
    }

    // Draw characters with distinct rotations and colors
    const charColors = ['#a5b4fc', '#f472b6', '#38bdf8', '#fbbf24', '#c084fc', '#34d399'];
    const fonts = ['bold 22px "JetBrains Mono", monospace', 'bold 24px monospace', 'bold 21px sans-serif'];
    const charSpacing = (width - 24) / code.length;

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const charColor = charColors[i % charColors.length];
      const font = fonts[i % fonts.length];

      ctx.save();
      const x = 16 + i * charSpacing + (Math.random() * 4 - 2);
      const y = height / 2 + (Math.random() * 6 - 3);

      ctx.translate(x, y);
      const angle = (Math.random() * 36 - 18) * (Math.PI / 180);
      ctx.rotate(angle);

      ctx.font = font;
      ctx.fillStyle = charColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 4;
      ctx.fillText(char, 0, 0);

      ctx.restore();
    }
  }, []);

  useEffect(() => {
    generateNewCaptcha();
  }, [generateNewCaptcha]);

  useEffect(() => {
    if (captchaCode) {
      drawCaptcha(captchaCode);
    }
  }, [captchaCode, drawCaptcha]);

  // Check validation state
  useEffect(() => {
    const isMatching = value.trim().toUpperCase() === captchaCode.toUpperCase() && captchaCode.length === 6;
    if (onValidChange) {
      onValidChange(isMatching);
    }
  }, [value, captchaCode, onValidChange]);

  // Audio readout using Web Speech API
  const handlePlayAudio = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const spokenText = captchaCode
      .split('')
      .map(char => isNaN(Number(char)) ? char : `number ${char}`)
      .join(', ');

    const utterance = new SpeechSynthesisUtterance(`Security code: ${spokenText}`);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const isMatched = value.trim().toUpperCase() === captchaCode.toUpperCase() && captchaCode.length === 6;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-slate-400">
        <label htmlFor={`${idPrefix}-input`} className="flex items-center gap-1.5 text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Security Verification (CAPTCHA)</span>
        </label>
        <span className="text-[11px] text-slate-400">Case-insensitive</span>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Canvas Display */}
        <div className="relative group shrink-0 rounded-lg overflow-hidden border border-slate-700/80 bg-slate-900/90 shadow-inner">
          <canvas
            ref={canvasRef}
            width={180}
            height={46}
            className="block select-none"
            title="CAPTCHA security image"
          />
          <div className="absolute inset-y-0 right-1 flex items-center gap-0.5 px-1 bg-slate-900/80 backdrop-blur-sm opacity-90 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={generateNewCaptcha}
              title="Refresh CAPTCHA code"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handlePlayAudio}
              disabled={isSpeaking}
              title="Read characters aloud"
              className={`p-1 rounded transition-colors ${
                isSpeaking
                  ? 'text-indigo-400 bg-indigo-950/60 animate-pulse'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Input Field */}
        <div className="relative flex-1">
          <input
            id={`${idPrefix}-input`}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="Enter 6 characters"
            maxLength={6}
            autoComplete="off"
            spellCheck={false}
            className={`w-full px-3.5 py-2.5 text-sm tracking-widest font-mono uppercase bg-slate-900/80 border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
              isMatched
                ? 'border-emerald-500/80 focus:ring-emerald-500/30'
                : error
                ? 'border-rose-500 focus:ring-rose-500/30'
                : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/30'
            }`}
          />
          {isMatched && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center gap-1 text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
