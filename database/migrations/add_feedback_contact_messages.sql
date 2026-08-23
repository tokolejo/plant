-- ==============================================================================
-- FEEDBACK & CONTACT INQUIRIES SYSTEM
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    type TEXT NOT NULL DEFAULT 'general',
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NEW', -- NEW, READ, REPLIED, ARCHIVED
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback(type);

-- Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback/inquiries
DROP POLICY IF EXISTS "feedback_insert_public" ON public.feedback;
CREATE POLICY "feedback_insert_public" ON public.feedback
    FOR INSERT WITH CHECK (true);

-- Only admins/moderators can view and manage feedback
DROP POLICY IF EXISTS "feedback_admin_all" ON public.feedback;
CREATE POLICY "feedback_admin_all" ON public.feedback
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (
                is_admin = true OR 
                role::text IN ('SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'MODERATOR', 'CONTENT_MANAGER', 'FINANCE_ADMIN')
            )
        )
    );
