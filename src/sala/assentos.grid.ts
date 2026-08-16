import { Prisma } from '@prisma/client';

export function letraDaFila(fila: number): string {
  let n = fila;
  let label = '';
  while (n > 0) {
    n -= 1;
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26);
  }
  return label;
}

export function assentosParaCapacidade(idSala: string, capacidade: number) {
  const colunas = Math.min(10, Math.max(1, capacidade));
  return Array.from({ length: capacidade }, (_, index) => {
    const fila = Math.floor(index / colunas) + 1;
    const coluna = (index % colunas) + 1;
    return {
      idSala,
      fila,
      coluna,
      descricao: `${letraDaFila(fila)}${coluna}`,
    };
  });
}

export async function ensureAssentos(
  prisma: Prisma.TransactionClient | PrismaServiceLike,
  idSala: string,
  capacidade: number,
) {
  const existentes = await prisma.assento.count({ where: { idSala } });
  if (existentes > 0) {
    return;
  }
  await prisma.assento.createMany({
    data: assentosParaCapacidade(idSala, capacidade),
  });
}

type PrismaServiceLike = {
  assento: {
    count: (args: { where: { idSala: string } }) => Promise<number>;
    createMany: (args: {
      data: ReturnType<typeof assentosParaCapacidade>;
    }) => Promise<unknown>;
  };
};

