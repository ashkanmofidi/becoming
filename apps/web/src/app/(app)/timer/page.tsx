/**
 * Timer page. PRD Section 5.
 * Primary interface and default landing page.
 * Full implementation in Phase 2.
 */
export default function TimerPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center">
        <p className="text-surface-500 text-sm font-mono uppercase tracking-wider mb-4">
          READY TO FOCUS
        </p>
        <div className="text-timer font-mono text-white mb-8">
          25:00
        </div>
        <p className="text-surface-500 text-sm">
          Timer implementation coming in Phase 2
        </p>
      </div>
    </div>
  );
}
