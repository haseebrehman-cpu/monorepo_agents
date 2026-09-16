import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  getAuthUser,
  getHomePath,
  getToken,
  isAdminUser,
  isSuperAdminUser,
} from "../lib/auth";
import { hasPermission } from "../lib/permissions";
import { useMe } from "../lib/use-me";

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  if (getToken()) {
    return <Navigate to={getHomePath()} replace />;
  }
  return children;
}

export function RoleHomeRedirect({ children }: { children: ReactNode }) {
  const location = useLocation();
  const me = useMe();
  const user = me.data?.user ?? getAuthUser();
  const roles = user?.roles;

  if (me.isLoading && !roles?.length) {
    return children;
  }

  if (isSuperAdminUser(user) && location.pathname !== "/access") {
    return <Navigate to="/access" replace />;
  }

  if (user && !isSuperAdminUser(user) && location.pathname === "/access") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const me = useMe();
  const user = me.data?.user ?? getAuthUser();
  const allowed = isSuperAdminUser(user);

  if (me.isLoading && !allowed) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Checking access...
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return children;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const me = useMe();
  const roles = me.data?.user.roles;
  const allowed = roles ? roles.includes("admin") : isAdminUser();

  if (me.isLoading && !isAdminUser()) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Checking access...
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function RequirePermission({
  code,
  children,
}: {
  code?: string;
  children: ReactNode;
}) {
  const me = useMe();
  const user = me.data?.user ?? getAuthUser();

  if (!code) return children;

  if (me.isLoading && !user?.permissions?.length && !isAdminUser(user)) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Checking access...
      </div>
    );
  }

  if (!hasPermission(user, code)) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return children;
}
