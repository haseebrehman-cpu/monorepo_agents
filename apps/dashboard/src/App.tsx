import { Button } from "@rdx/ui";

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-linear-to-b from-slate-50 to-slate-100 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">
        Dashboard
      </h1>
      <Button>Click me</Button>
    </main>
  );
}
