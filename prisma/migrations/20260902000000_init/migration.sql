CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'SUPPORT', 'MANAGER');
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED');
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "TicketCategory" AS ENUM ('IT_HARDWARE', 'SOFTWARE', 'ACCOUNT_ACCESS', 'NETWORK', 'FACILITIES', 'HR_PEOPLE', 'OTHER');
CREATE TYPE "ActivityType" AS ENUM ('CREATED', 'ASSIGNED', 'REASSIGNED', 'STATUS_CHANGED', 'PROGRESS_UPDATE', 'RESOLVED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE SEQUENCE "Ticket_sequence_seq";
CREATE TABLE "Ticket" (
  "id" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL DEFAULT nextval('"Ticket_sequence_seq"'),
  "displayId" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" "TicketCategory" NOT NULL,
  "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
  "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
  "version" INTEGER NOT NULL DEFAULT 1,
  "requesterId" TEXT NOT NULL,
  "assigneeId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

CREATE FUNCTION set_ticket_display_id() RETURNS TRIGGER AS $$
BEGIN
  NEW."displayId" := 'HD-' || LPAD(NEW."sequence"::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_display_id_before_insert
BEFORE INSERT ON "Ticket"
FOR EACH ROW EXECUTE FUNCTION set_ticket_display_id();

CREATE TABLE "TicketActivity" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "type" "ActivityType" NOT NULL,
  "content" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthAttempt" (
  "email" TEXT NOT NULL,
  "failures" INTEGER NOT NULL DEFAULT 0,
  "windowStarted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "blockedUntil" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuthAttempt_pkey" PRIMARY KEY ("email")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_active_idx" ON "User"("role", "active");
CREATE UNIQUE INDEX "Ticket_sequence_key" ON "Ticket"("sequence");
CREATE UNIQUE INDEX "Ticket_displayId_key" ON "Ticket"("displayId");
CREATE UNIQUE INDEX "Ticket_requestKey_key" ON "Ticket"("requestKey");
CREATE INDEX "Ticket_requesterId_updatedAt_idx" ON "Ticket"("requesterId", "updatedAt" DESC);
CREATE INDEX "Ticket_assigneeId_status_updatedAt_idx" ON "Ticket"("assigneeId", "status", "updatedAt" DESC);
CREATE INDEX "Ticket_status_updatedAt_idx" ON "Ticket"("status", "updatedAt" DESC);
CREATE INDEX "Ticket_priority_updatedAt_idx" ON "Ticket"("priority", "updatedAt" DESC);
CREATE INDEX "Ticket_category_updatedAt_idx" ON "Ticket"("category", "updatedAt" DESC);
CREATE INDEX "TicketActivity_ticketId_createdAt_idx" ON "TicketActivity"("ticketId", "createdAt");
CREATE INDEX "TicketActivity_actorId_createdAt_idx" ON "TicketActivity"("actorId", "createdAt");

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TicketActivity" ADD CONSTRAINT "TicketActivity_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketActivity" ADD CONSTRAINT "TicketActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
