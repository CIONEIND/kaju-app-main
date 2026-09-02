-- CreateTable
CREATE TABLE "UF" (
    "id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "UF_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Municipio" (
    "id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "ufId" INTEGER NOT NULL,

    CONSTRAINT "Municipio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Municipio" ADD CONSTRAINT "Municipio_ufId_fkey" FOREIGN KEY ("ufId") REFERENCES "UF"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
