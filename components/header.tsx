export default function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Natural Language to Excel</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Convert your questions into actionable insights from your data
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
