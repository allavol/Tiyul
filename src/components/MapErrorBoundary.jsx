import React, { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MapErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">התרחשה שגיאה ברכיב המפה</h3>
          <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
            שאר חלקי המערכת (סוכן השיחה, סרגל האתרים וחמ״ל הנתונים) ממשיכים לפעול כרגיל ללא הפרעה.
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(45,212,191,0.3)] active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>אתחל מפה מחדש</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
