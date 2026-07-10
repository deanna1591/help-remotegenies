import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container-wide flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="RemoteGenies" width={32} height={32} className="rounded-md" />
          <span className="font-semibold text-ink">
            RemoteGenies <span className="text-ink-muted font-normal hidden sm:inline">Help Center</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          
            href="https://app.remotegenies.com"
            className="hidden sm:inline text-sm text-ink-muted hover:text-ink transition"
          >
            Go to app
          </a>
          
            href="https://app.remotegenies.com/sign-in"
            className="text-sm font-medium bg-white border border-gray-200 hover:border-primary hover:text-primary text-ink px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition"
          >
            Log in
          </a>
          
            href="https://app.remotegenies.com/register"
            className="text-sm font-medium bg-gradient-primary text-white hover:opacity-95 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition"
          >
            Sign up
          </a>
        </nav>
      </div>
    </header>
  );
}