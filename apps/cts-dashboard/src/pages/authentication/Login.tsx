import { useState, type FormEvent } from "react";
import { Button, Input } from "@rdx/ui";
import { EyeIcon, EyeOffIcon, LoaderCircleIcon } from "lucide-react";
import { getLoginErrorMessage } from "../../lib/auth";
import { useLogin } from "../../lib/use-login";

const Login = () => {
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    login.mutate({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });
  };

  return (
    <div className="flex min-h-dvh bg-slate-50">
      <div className="hidden w-[42%] flex-col justify-between bg-slate-950 p-10 text-slate-300 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            CTS
          </div>
          <div>
            <p className="text-sm font-semibold text-white">CTS</p>
            <p className="text-xs text-slate-400">Courier Dashboard</p>
          </div>
        </div>

        <div className="max-w-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Track, resolve, and ship with confidence.
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Sign in to manage tickets, refunds, and courier operations from one
            place.
          </p>
        </div>

        <p className="text-xs text-slate-500">Courier Tracking System</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">
              CTS
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">CTS</p>
              <p className="text-xs text-slate-500">Courier Dashboard</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use your CTS account to continue.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
              />
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((open) => !open)}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {login.isError ? (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {getLoginErrorMessage(login.error)}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            className="mt-6 w-full"
            disabled={login.isPending}
          >
            {login.isPending ? (
              <>
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
