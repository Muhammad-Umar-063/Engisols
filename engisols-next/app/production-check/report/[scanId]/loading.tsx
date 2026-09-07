export default function LoadingReport() {
  return (
    <section className="min-h-[70dvh] bg-vanilla pt-[calc(var(--spacing-step-6)+3rem)] text-bordeaux">
      <div className="shell py-step-6" role="status">
        <p className="font-mono text-xs text-current/60">LOADING REPORT</p>
        <div className="mt-step-3 h-24 max-w-3xl animate-pulse rounded-sm bg-bordeaux/10 motion-reduce:animate-none" />
        <div className="mt-step-5 grid grid-cols-3 gap-step-2">
          <div className="h-20 bg-bordeaux/10" /><div className="h-20 bg-bordeaux/10" /><div className="h-20 bg-bordeaux/10" />
        </div>
      </div>
    </section>
  )
}
