interface TokenPayload {
  userId: number;
  email: string;
  role: "user" | "admin";
}

export function getCurrentUser(): TokenPayload | null {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1])
    ) as TokenPayload;

    return payload;
  } catch {
    return null;
  }
}