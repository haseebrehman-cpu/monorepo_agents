import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getMe, getHomePath, login, setSession } from "./auth";

type LocationState = {
  from?: { pathname?: string };
};

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    retry: false,
    onSuccess: async (response) => {
      setSession(response.data.token, response.data.user);
      let signedInUser = response.data.user;
      try {
        const me = await getMe();
        signedInUser = {
          id: me.user.id,
          email: me.user.email,
          name: me.user.name,
          roles: me.user.roles,
          permissions: me.user.permissions,
          department: me.user.department,
        };
        setSession(response.data.token, signedInUser);
      } catch {
        // Keep the login payload if /me is unavailable.
      }
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      const from = (location.state as LocationState | null)?.from?.pathname;
      toast.success("Signed in successfully");
      navigate(from && from !== "/login" ? from : getHomePath(signedInUser), { replace: true });
    },
  });
}
