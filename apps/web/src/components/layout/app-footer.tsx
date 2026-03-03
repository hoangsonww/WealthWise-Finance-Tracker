import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="border-t border-border py-4">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        <p>&copy; {new Date().getFullYear()} WealthWise</p>
        <div className="flex gap-4">
          <Link
            href="/terms"
            className="underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground"
          >
            Privacy
          </Link>
          <a
            href="https://sonnguyenhoang.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground"
          >
            Creator
          </a>
        </div>
      </div>
    </footer>
  );
}
