import { buttonPrimary } from "@/components/ui/styles";

export default function OfflinePage() {
  return (
    <section className="flex flex-col items-start gap-4 rounded-2xl bg-card p-6">
      <div>
        <h1 className="text-[22px] font-medium leading-7 text-fg">You’re offline</h1>
        <p className="mt-2 max-w-[60ch] text-[16px] leading-6 text-muted">
          AskMe could not load this page. Previously visited pages and your local study data may still be available.
          Connect to the internet to open a page that has not been cached yet.
        </p>
      </div>
      <a href="/" className={buttonPrimary}>
        Try again
      </a>
    </section>
  );
}
