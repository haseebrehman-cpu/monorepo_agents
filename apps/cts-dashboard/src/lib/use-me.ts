import { useQuery } from "@tanstack/react-query";
import { getMe, getToken, setSession } from "./auth";

export function useMe() {
  const token = getToken();
  return useQuery({
    queryKey: ["me", token],
    enabled: Boolean(token),
    queryFn: async () => {
      const data = await getMe();
      if (token) {
        setSession(token, {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          roles: data.user.roles,
          permissions: data.user.permissions,
          department: data.user.department,
        });
      }
      return data;
    },
  });
}
