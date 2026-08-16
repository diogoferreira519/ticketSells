import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'senha123';

async function upsertUser(data: {
  nome: string;
  email: string;
  isOrg: boolean;
  isCliente: boolean;
  isPortaria: boolean;
}) {
  const senha = await bcrypt.hash(SEED_PASSWORD, 10);
  return prisma.usuario.upsert({
    where: { email: data.email },
    update: {
      nome: data.nome,
      senha,
      isOrg: data.isOrg,
      isCliente: data.isCliente,
      isPortaria: data.isPortaria,
    },
    create: {
      nome: data.nome,
      email: data.email,
      senha,
      isOrg: data.isOrg,
      isCliente: data.isCliente,
      isPortaria: data.isPortaria,
    },
  });
}

async function main() {
  await upsertUser({
    nome: 'Organizador',
    email: 'org@ticketsells.local',
    isOrg: true,
    isCliente: false,
    isPortaria: false,
  });
  await upsertUser({
    nome: 'Cliente',
    email: 'cliente@ticketsells.local',
    isOrg: false,
    isCliente: true,
    isPortaria: false,
  });
  await upsertUser({
    nome: 'SegundoCliente',
    email: 'segundocliente@ticketsells.local',
    isOrg: false,
    isCliente: true,
    isPortaria: false,
  });
  await upsertUser({
    nome: 'Portaria',
    email: 'portaria@ticketsells.local',
    isOrg: false,
    isCliente: false,
    isPortaria: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
