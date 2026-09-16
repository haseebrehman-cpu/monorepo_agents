import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { clearSession, logout } from "./auth";

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    retry: false,
    onSettled: async () => {
      clearSession();
      queryClient.clear();
      toast.success("Signed out");
      navigate("/login", { replace: true });
    },
  });
}
