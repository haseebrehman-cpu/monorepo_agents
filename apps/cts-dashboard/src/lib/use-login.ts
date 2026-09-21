import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getHomePath, login, type MeResponse } from "./auth";

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
    onSuccess: (response) => {
      const signedInUser = response.data.user;
      queryClient.setQueryData<MeResponse>(["me"], {
        success: true,
        user: {
          ...signedInUser,
          roles: signedInUser.roles ?? [],
          permissions: signedInUser.permissions ?? [],
        },
      });
      const from = (location.state as LocationState | null)?.from?.pathname;
      toast.success("Signed in successfully");
      navigate(from && from !== "/login" ? from : getHomePath(signedInUser), { replace: true });
    },
  });
}
