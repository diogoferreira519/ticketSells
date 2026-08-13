export type User = {
  id: string;
  email: string;
  createdAt: string;
};

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) {
      return data.message.join(', ');
    }
    return data.message ?? 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export async function loginRequest(email: string, password: string) {
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return (await res.json()) as { access_token: string };
}

export async function registerRequest(email: string, password: string) {
  const res = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return (await res.json()) as {
    access_token: string;
    user: User;
  };
}

export async function meRequest(token: string) {
  const res = await fetch('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return (await res.json()) as User;
}
