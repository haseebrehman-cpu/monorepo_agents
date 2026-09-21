import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  getHomePath,
  isAdminUser,
  isSuperAdminUser,
} from "../lib/auth";
import { hasPermission } from "../lib/permissions";
import { useMe } from "../lib/use-me";

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const me = useMe();

  if (me.isPending) {
    return <div className="p-6 text-sm text-slate-500">Checking session...</div>;
  }

  if (me.isError) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const me = useMe();

  if (me.isPending) {
    return <div className="p-6 text-sm text-slate-500">Checking session...</div>;
  }

  if (me.data?.user) {
    return <Navigate to={getHomePath(me.data.user)} replace />;
  }
  return children;
}

export function RoleHomeRedirect({ children }: { children: ReactNode }) {
  const location = useLocation();
  const me = useMe();
  const user = me.data?.user;
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
  const user = me.data?.user;
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
  const allowed = roles ? roles.includes("admin") : false;

  if (me.isLoading) {
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
  const user = me.data?.user;

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
