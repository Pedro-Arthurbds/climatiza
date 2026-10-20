export function notificationScope(
  role: string | undefined,
  userId: string | undefined
) {
  if (role !== "TECNICO") return {};

  return {
    ticket: {
      is: {
        OR: [{ userId: userId ?? "" }, { userId: null }],
      },
    },
  };
}
