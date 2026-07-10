import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 py-10 mt-10">
      <div className="container-wide flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-ink-muted">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="RemoteGenies" width={20} height={20} className="rounded" />
          <span>© {new Date().getFullYear()} RemoteGenies</span>
        </div>
        <nav className="flex items-center gap-6 flex-wrap justify-center">
          <a href="https://remotegenies.com" className="hover:text-ink transition">Home</a>
          <a href="https://app.remotegenies.com" className="hover:text-ink transition">Platform</a>
          <a href="https://app.remotegenies.com/register" className="hover:text-ink transition">Sign up</a>
          <a href="mailto:info@remotegenies.com" className="hover:text-ink transition">Contact</a>
        </nav>
      </div>
      <div className="container-wide mt-6 pt-6 border-t border-gray-50 flex items-center justify-center gap-x-3 gap-y-2 flex-wrap text-[10px] text-ink-faint">
        <a href="https://www.remotegenies.com/legal#privacypolicy" target="_blank" rel="noopener noreferrer" className="hover:text-ink-muted transition">Privacy Policy</a>
        <span>|</span>
        <a href="https://www.remotegenies.com/legal" target="_blank" rel="noopener noreferrer" className="hover:text-ink-muted transition">Terms and Conditions</a>
        <span>|</span>
        <a href="https://www.remotegenies.com/legal" target="_blank" rel="noopener noreferrer" className="hover:text-ink-muted transition">Legal Center</a>
        <span>|</span>
        <a href="https://www.remotegenies.com/legal#Cookie-Policy" target="_blank" rel="noopener noreferrer" className="hover:text-ink-muted transition">Cookie Policy</a>
        <span>|</span>
        <a href="https://www.remotegenies.com/geniescholar" target="_blank" rel="noopener noreferrer" className="hover:text-ink-muted transition">GenieScholar</a>
      </div>
    </footer>
  );
}