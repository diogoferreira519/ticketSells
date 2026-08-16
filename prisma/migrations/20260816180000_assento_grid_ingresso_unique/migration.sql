ALTER TABLE "assentos" ADD COLUMN "fila" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "assentos" ADD COLUMN "coluna" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "assentos" ALTER COLUMN "fila" DROP DEFAULT;
ALTER TABLE "assentos" ALTER COLUMN "coluna" DROP DEFAULT;

CREATE UNIQUE INDEX "ingressos_id_evento_id_assento_key" ON "ingressos"("id_evento", "id_assento");
