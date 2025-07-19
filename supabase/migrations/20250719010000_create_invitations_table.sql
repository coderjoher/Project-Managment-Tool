-- Create invitations table
CREATE TABLE "invitations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" text NOT NULL,
    "token" text NOT NULL,
    "invited_by" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "role" text NOT NULL CHECK (role IN ('MANAGER', 'FREELANCER')),
    "created_at" timestamp with time zone DEFAULT now(),
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    CONSTRAINT "invitations_email_unique_pending" UNIQUE NULLS NOT DISTINCT ("email", "used_at")
);

-- Create index for faster lookups
CREATE INDEX idx_invitations_token ON "invitations"("token");
CREATE INDEX idx_invitations_email ON "invitations"("email");
CREATE INDEX idx_invitations_expiry ON "invitations"("expires_at");

-- Enable RLS
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own invitations" ON "invitations"
    FOR SELECT USING (
        invited_by = auth.uid()
    );

CREATE POLICY "Users can create invitations" ON "invitations"
    FOR INSERT WITH CHECK (
        -- Only managers can create invitations
        EXISTS (
            SELECT 1 FROM "User"
            WHERE id = auth.uid()
            AND role = 'MANAGER'
        )
    );
