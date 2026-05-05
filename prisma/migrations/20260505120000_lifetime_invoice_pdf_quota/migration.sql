-- Free-plan cap: branded CRM invoice PDF downloads (lifetime; Pro skips enforcement).
ALTER TABLE "User" ADD COLUMN "lifetimeInvoicePdfsGenerated" INTEGER NOT NULL DEFAULT 0;
