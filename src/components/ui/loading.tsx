'use client';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background z-[9999] flex flex-col items-center justify-center">
      {/* Waveform loader */}
      <div className="waveform-loader mb-6">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  );
}
