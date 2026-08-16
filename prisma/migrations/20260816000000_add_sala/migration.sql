-- CreateTable
CREATE TABLE "salas" (
    "id" TEXT NOT NULL,
    "id_user_organizador" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "salas_pkey" PRIMARY KEY ("id")
);

-- AlterTable eventos: drop old columns, add id_sala (clear existing rows first)
DELETE FROM "eventos";
ALTER TABLE "eventos" DROP COLUMN "local",
DROP COLUMN "capacidade",
DROP COLUMN "ingressos_disponiveis",
ADD COLUMN "id_sala" TEXT NOT NULL;

-- AlterTable assentos
DELETE FROM "ingressos";
DELETE FROM "assentos";
ALTER TABLE "assentos" DROP CONSTRAINT "assentos_id_user_fkey";
ALTER TABLE "assentos" DROP COLUMN "id_user",
DROP COLUMN "disponivel",
ADD COLUMN "id_sala" TEXT NOT NULL;

-- AlterTable ingressos
ALTER TABLE "ingressos" DROP CONSTRAINT "ingressos_id_user_fkey";
ALTER TABLE "ingressos" DROP COLUMN "id_user",
ADD COLUMN "id_evento" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "salas" ADD CONSTRAINT "salas_id_user_organizador_fkey" FOREIGN KEY ("id_user_organizador") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "eventos" ADD CONSTRAINT "eventos_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "salas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "assentos" ADD CONSTRAINT "assentos_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "salas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ingressos" ADD CONSTRAINT "ingressos_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
