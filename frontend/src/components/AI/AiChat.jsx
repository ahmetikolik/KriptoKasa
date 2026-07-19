import React from 'react';

export default function AiChat({ session, aiOpen, setAiOpen, aiPosition, setAiPosition, aiQuestion, setAiQuestion, aiAnswer, loading, onSubmit }) {
  
  function handleDragStart(e) {
    if (e.button !== 0) return;
    const widget = e.currentTarget.closest('.floating-ai-widget');
    if (!widget) return;
    e.preventDefault();

    const startRect = widget.getBoundingClientRect();
    const offsetX = e.clientX - startRect.left;
    const offsetY = e.clientY - startRect.top;

    function moveWidget(moveEvent) {
      const width = widget.offsetWidth;
      const height = widget.offsetHeight;
      const left = Math.min(Math.max(moveEvent.clientX - offsetX, 12), window.innerWidth - width - 12);
      const top = Math.min(Math.max(moveEvent.clientY - offsetY, 12), window.innerHeight - height - 12);
      setAiPosition({ left, top });
    }

    function stopMove() {
      window.removeEventListener('pointermove', moveWidget);
      window.removeEventListener('pointerup', stopMove);
    }

    window.addEventListener('pointermove', moveWidget);
    window.addEventListener('pointerup', stopMove, { once: true });
  }

  const positionStyle = aiPosition.left == null
    ? { bottom: `${aiPosition.bottom ?? 24}px`, right: `${aiPosition.right ?? 24}px` }
    : { left: `${aiPosition.left}px`, top: `${aiPosition.top}px` };

  if (!aiOpen) {
    return (
      <button
        onClick={() => setAiOpen(true)}
        style={positionStyle}
        className="fixed z-50 w-14 h-14 rounded-full bg-primary-container shadow-[0_0_20px_rgba(0,209,255,0.4)] flex items-center justify-center text-on-primary-container hover:scale-105 hover:shadow-[0_0_30px_rgba(0,209,255,0.6)] transition-all group"
      >
        <span className="material-symbols-outlined text-3xl group-hover:animate-pulse">smart_toy</span>
      </button>
    );
  }

  return (
    <section
      style={positionStyle}
      className="floating-ai-widget fixed z-50 w-[min(380px,calc(100vw-24px))] glass-panel rounded-2xl shadow-2xl border border-primary-container/30 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <header
        onPointerDown={handleDragStart}
        className="flex items-center justify-between px-md py-sm bg-surface-container-high border-b border-white/10 cursor-move touch-none"
      >
        <div className="flex items-center gap-sm">
          <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined text-sm">smart_toy</span>
          </div>
          <div>
            <p className="text-[10px] font-tech-mono text-primary-container uppercase tracking-wider">AI Insights</p>
            <h3 className="text-sm font-headline-md text-on-surface">CryptoPal Asistan</h3>
          </div>
        </div>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setAiOpen(false)}
          className="p-1 rounded bg-white/5 text-on-surface-variant hover:text-white hover:bg-error/80 transition-all"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </header>

      {/* Body */}
      {session ? (
        <form onSubmit={onSubmit} className="flex flex-col p-md gap-md bg-surface-container-lowest">
          {aiAnswer && (
            <div className="max-h-[250px] overflow-auto text-sm text-on-surface-variant bg-surface-container-low rounded-xl p-sm border border-white/5 whitespace-pre-wrap font-body-base leading-relaxed">
              {aiAnswer}
            </div>
          )}

          <div className="relative mt-2">
            <textarea
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="Piyasa hakkında bir soru sorun..."
              rows={3}
              maxLength={1000}
              required
              className="w-full bg-[#121212] border border-white/10 rounded-xl p-sm pr-12 text-sm text-secondary placeholder-on-surface-variant/50 outline-none focus:border-primary-container/50 focus:shadow-[0_0_10px_rgba(0,209,255,0.1)] resize-none transition-all font-tech-mono"
            />
            <button
              type="submit"
              disabled={loading || !aiQuestion.trim()}
              className="absolute right-2 bottom-3 p-2 rounded-lg bg-primary-container text-on-primary-container disabled:opacity-50 transition-all hover:brightness-110 flex items-center justify-center"
            >
              {loading ? (
                <span className="material-symbols-outlined text-sm animate-spin">hourglass_empty</span>
              ) : (
                <span className="material-symbols-outlined text-sm">send</span>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-xl text-center bg-surface-container-lowest">
          <div className="inline-flex p-3 rounded-full bg-white/5 mb-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <p className="text-sm text-on-surface-variant font-body-base">Yapay zeka asistanını kullanmak için lütfen cüzdanınızı bağlayın.</p>
        </div>
      )}
    </section>
  );
}
