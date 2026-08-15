-- CreateEnum
CREATE TYPE "PagamentoStatus" AS ENUM ('PENDENTE', 'PAGO', 'CANCELADO', 'FALHOU');

-- CreateEnum
CREATE TYPE "IngressoStatus" AS ENUM ('VALIDO', 'USADO', 'CANCELADO');

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "is_org" BOOLEAN NOT NULL DEFAULT false,
    "is_cliente" BOOLEAN NOT NULL DEFAULT true,
    "is_portaria" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "pagamento_status" "PagamentoStatus" NOT NULL DEFAULT 'PENDENTE',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assentos" (
    "id" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "assentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingressos" (
    "id" TEXT NOT NULL,
    "id_pedido" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "id_assento" TEXT NOT NULL,
    "qrcode" TEXT NOT NULL,
    "status" "IngressoStatus" NOT NULL DEFAULT 'VALIDO',
    "link" TEXT NOT NULL,
    "usado_em" TIMESTAMP(3),

    CONSTRAINT "ingressos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" TEXT NOT NULL,
    "id_filme" TEXT NOT NULL,
    "id_user_organizador" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "img_filme" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "ingressos_disponiveis" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assentos" ADD CONSTRAINT "assentos_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingressos" ADD CONSTRAINT "ingressos_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingressos" ADD CONSTRAINT "ingressos_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingressos" ADD CONSTRAINT "ingressos_id_assento_fkey" FOREIGN KEY ("id_assento") REFERENCES "assentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_id_user_organizador_fkey" FOREIGN KEY ("id_user_organizador") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
