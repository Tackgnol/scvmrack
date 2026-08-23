CREATE TABLE "obr_auth_handoffs" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obr_auth_handoffs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "obr_auth_handoffs_expires_at_idx" ON "obr_auth_handoffs"("expires_at");
