export type User = {
  id: string;
  nome: string;
  email: string;
  isOrg: boolean;
  isCliente: boolean;
  isPortaria: boolean;
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

export async function registerRequest(nome: string, email: string, password: string) {
  const res = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, password }),
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

export type FilmeResumo = {
  idFilme: string;
  titulo: string;
  descricao: string;
  imgFilme: string | null;
  dataLancamento: string | null;
};

export type FilmeDetalhe = FilmeResumo & {
  tituloOriginal: string;
  duracaoMinutos: number | null;
  notaMedia: number;
  generos: string[];
};

export type FilmeLista = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: FilmeResumo[];
};

export type FilmeGenero = {
  id: number;
  nome: string;
};

export type Sala = {
  id: string;
  idUserOrganizador: string;
  descricao: string;
  capacidade: number;
};

export type Evento = {
  id: string;
  idFilme: string;
  idUserOrganizador: string;
  idSala: string;
  titulo: string;
  descricao: string;
  imgFilme: string;
  data: string;
  preco: number;
  criadoEm: string;
  vendas: number;
  sala: Sala;
};

export type CreateEventoPayload = {
  idFilme: string;
  idSala: string;
  titulo: string;
  descricao: string;
  imgFilme: string;
  data: string;
  preco: number;
};

export type CreateSalaPayload = {
  descricao: string;
  capacidade: number;
};

export type CatalogoSala = {
  id: string;
  descricao: string;
  capacidade: number;
};

export type CatalogoEvento = {
  id: string;
  idFilme: string;
  titulo: string;
  descricao: string;
  imgFilme: string;
  data: string;
  preco: number;
  vagas: number;
  sala: CatalogoSala;
};

export type CatalogoAssento = {
  id: string;
  descricao: string;
  fila: number;
  coluna: number;
  ocupado: boolean;
};

export type CatalogoEventoDetalhe = CatalogoEvento & {
  assentos: CatalogoAssento[];
};

export type ReservaIngressoItem = {
  id: string;
  idAssento: string;
  descricaoAssento: string;
  qrcode: string;
  link: string;
};

export type ReservaResult = {
  idPedido: string;
  total: number;
  pagamentoStatus: string;
  ingressos: ReservaIngressoItem[];
};

export type PagamentoStatusResult = {
  idPedido: string;
  total: number;
  pagamentoStatus: string;
};

export type MeuIngresso = {
  id: string;
  qrcode: string;
  link: string;
  status: string;
  idPedido: string;
  assento: { id: string; descricao: string };
  evento: {
    id: string;
    titulo: string;
    data: string;
    imgFilme: string;
    sala: { descricao: string };
  };
};

export type IngressoPublico = {
  id: string;
  qrcode: string;
  link: string;
  status: string;
  assento: { descricao: string };
  evento: {
    titulo: string;
    data: string;
    sala: { descricao: string };
  };
};

export type ValidarIngressoResultado =
  | 'VALIDO'
  | 'INVALIDO'
  | 'JA_UTILIZADO'
  | 'EVENTO_ERRADO';

export type ValidarIngressoResponse = {
  resultado: ValidarIngressoResultado;
  assento?: string;
  eventoTitulo?: string;
  usadoEm?: string | null;
};

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function filmesPopularRequest(page = 1) {
  const res = await fetch(`/filmes/popular?page=${page}`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as FilmeLista;
}

export async function filmesNowPlayingRequest(page = 1) {
  const res = await fetch(`/filmes/now-playing?page=${page}`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as FilmeLista;
}

export async function filmesSearchRequest(query: string, page = 1) {
  const params = new URLSearchParams({ query, page: String(page) });
  const res = await fetch(`/filmes/search?${params}`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as FilmeLista;
}

export async function filmesGenerosRequest() {
  const res = await fetch('/filmes/generos');
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as FilmeGenero[];
}

export async function filmeByIdRequest(id: string) {
  const res = await fetch(`/filmes/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as FilmeDetalhe;
}

export async function filmesDiscoverRequest(genreId: number, page = 1) {
  const params = new URLSearchParams({
    genreId: String(genreId),
    page: String(page),
  });
  const res = await fetch(`/filmes/discover?${params}`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as FilmeLista;
}

export async function listEventosRequest(token: string) {
  const res = await fetch('/eventos', {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as Evento[];
}

export async function createEventoRequest(
  token: string,
  payload: CreateEventoPayload,
) {
  const res = await fetch('/eventos', {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as Evento;
}

export async function getEventoRequest(token: string, id: string) {
  const res = await fetch(`/eventos/${encodeURIComponent(id)}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as Evento;
}

export async function updateEventoRequest(
  token: string,
  id: string,
  payload: CreateEventoPayload,
) {
  const res = await fetch(`/eventos/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as Evento;
}

export async function deleteEventoRequest(token: string, id: string) {
  const res = await fetch(`/eventos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
}

export async function listSalasRequest(token: string) {
  const res = await fetch('/salas', {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as Sala[];
}

export async function createSalaRequest(token: string, payload: CreateSalaPayload) {
  const res = await fetch('/salas', {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as Sala;
}

export async function listCatalogoEventosRequest(token: string) {
  const res = await fetch('/catalogo/eventos', {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as CatalogoEvento[];
}

export async function getCatalogoEventoRequest(token: string, id: string) {
  const res = await fetch(`/catalogo/eventos/${encodeURIComponent(id)}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as CatalogoEventoDetalhe;
}

export async function reservarAssentoRequest(
  token: string,
  idEvento: string,
  idAssentos: string[],
) {
  const res = await fetch(
    `/catalogo/eventos/${encodeURIComponent(idEvento)}/reservar`,
    {
      method: 'POST',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idAssentos }),
    },
  );
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as ReservaResult;
}

export async function confirmarPagamentoRequest(
  token: string,
  idPedido: string,
) {
  const res = await fetch(
    `/pagamentos/${encodeURIComponent(idPedido)}/confirmar`,
    {
      method: 'POST',
      headers: authHeaders(token),
    },
  );
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as { aceito: true };
}

export async function recusarPagamentoRequest(token: string, idPedido: string) {
  const res = await fetch(
    `/pagamentos/${encodeURIComponent(idPedido)}/recusar`,
    {
      method: 'POST',
      headers: authHeaders(token),
    },
  );
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as { aceito: true };
}

export async function getPagamentoStatusRequest(
  token: string,
  idPedido: string,
) {
  const res = await fetch(`/pagamentos/${encodeURIComponent(idPedido)}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as PagamentoStatusResult;
}

export async function pollPagamentoStatus(
  token: string,
  idPedido: string,
  options?: { intervalMs?: number; timeoutMs?: number },
) {
  const intervalMs = options?.intervalMs ?? 500;
  const timeoutMs = options?.timeoutMs ?? 15_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const status = await getPagamentoStatusRequest(token, idPedido);
    if (status.pagamentoStatus !== 'PENDENTE') {
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error('Tempo esgotado aguardando o pagamento');
}

export async function listMeusIngressosRequest(token: string) {
  const res = await fetch('/ingressos/meus', {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as MeuIngresso[];
}

export async function getIngressoPorCodigoRequest(qrcode: string) {
  const res = await fetch(
    `/ingressos/por-codigo/${encodeURIComponent(qrcode)}`,
  );
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as IngressoPublico;
}

export async function validarIngressoRequest(
  token: string,
  payload: { qrcode: string; idEvento: string },
) {
  const res = await fetch('/ingressos/validar', {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as ValidarIngressoResponse;
}
