/**
 * Skip to content link. PRD Section 5.2.9.
 * Visible on focus for keyboard users.
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-amber focus:text-white focus:rounded-lg focus:text-sm"
    >
      Skip to content
    </a>
  );
}
