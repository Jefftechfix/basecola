export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="max-w-md text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-primary">404</p>
        <h1 className="mt-2 text-3xl font-extrabold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">The page you requested could not be found.</p>
        <a
          href="/"
          className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
        >
          Back to Basecola
        </a>
      </div>
    </main>
  );
}
