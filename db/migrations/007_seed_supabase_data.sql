    -- Ensure all required columns exist in applications
    ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS interview_date date,
    ADD COLUMN IF NOT EXISTS interview_time time,
    ADD COLUMN IF NOT EXISTS final_interview_date date,
    ADD COLUMN IF NOT EXISTS final_interview_time time,
    ADD COLUMN IF NOT EXISTS is_deployed boolean default false,
    ADD COLUMN IF NOT EXISTS withdraw_reason text;

    -- Migration: seed data matching current schema (users, hr_users, audit fields, etc.)
    -- Generated for Supabase schema with audit fields and separated HR table

    -- HR USERS
    INSERT INTO hr_users (id, email, password, name, phone, created_by, created_at)
    VALUES
    ('HR001', 'hr@example.com', 'change-me', 'HR Admin', '09170000000', NULL, '2026-04-01T00:00:00Z')
    ON CONFLICT (id) DO UPDATE
    SET
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    created_by = EXCLUDED.created_by,
    created_at = EXCLUDED.created_at;


        -- Use a PL/pgSQL block to safely upsert user, application, and related rows
        DO $$
        DECLARE
            v_user_id TEXT;
            v_app_id UUID;
            v_user_id_uuid UUID;
            v_col_type TEXT;
        BEGIN
            -- Upsert user and fetch id
            INSERT INTO users (email, password, name, phone, role, created_by, created_at)
            VALUES ('intern@example.com', 'change-me', 'Sample Intern', '09170000001', 'intern', NULL, '2026-04-01T00:00:00Z')
            ON CONFLICT (email) DO UPDATE
            SET
                password = EXCLUDED.password,
                name = EXCLUDED.name,
                phone = EXCLUDED.phone,
                role = EXCLUDED.role,
                created_by = EXCLUDED.created_by,
                created_at = EXCLUDED.created_at;

            SELECT id INTO v_user_id FROM users WHERE email = 'intern@example.com' ORDER BY created_at DESC LIMIT 1;

            -- Detect applications.user_id column type
            SELECT data_type INTO v_col_type
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'user_id'
            LIMIT 1;

            v_user_id_uuid := NULL;
            IF v_col_type = 'uuid' THEN
                BEGIN
                    v_user_id_uuid := v_user_id::uuid;
                EXCEPTION WHEN others THEN
                    v_user_id_uuid := NULL;
                END;
            END IF;

            -- Find existing application by email+applied_date, otherwise insert and return id
            SELECT id INTO v_app_id FROM applications WHERE email = 'intern@example.com' AND applied_date = '2026-04-01' ORDER BY created_at DESC LIMIT 1;

            IF v_app_id IS NULL THEN
                IF v_col_type = 'uuid' THEN
                    INSERT INTO applications (user_id, name, email, phone, course, school, cv_name, cover_name, ojt_type, hours_required, source, status, applied_date, quarter, department, supervisor, schedule, start_date, company_docs, school_docs, interview_date, interview_time, final_interview_date, final_interview_time, is_deployed, withdraw_reason, created_by, created_at)
                    VALUES (v_user_id_uuid, 'Sample Intern', 'intern@example.com', '09170000001', 'BS Information Technology', 'Sample University', 'cv.pdf', 'portfolio.pdf', 'required', 480, 'LinkedIn', 'accepted', '2026-04-01', 'Q2-2026', 'IT', 'To be assigned', 'Mon-Fri, 8:00 AM - 5:00 PM', '2026-04-15', '{"offer_letter":"submitted"}'::jsonb, '[{"id":"sd_001","name":"Endorsement Letter","fileName":"endorsement.pdf","status":"submitted","signedBy":null}]'::jsonb, '2026-04-05', '10:00', '2026-04-10', '14:00', FALSE, NULL, NULL, '2026-04-01T00:00:00Z')
                    RETURNING id INTO v_app_id;
                ELSE
                    INSERT INTO applications (user_id, name, email, phone, course, school, cv_name, cover_name, ojt_type, hours_required, source, status, applied_date, quarter, department, supervisor, schedule, start_date, company_docs, school_docs, interview_date, interview_time, final_interview_date, final_interview_time, is_deployed, withdraw_reason, created_by, created_at)
                    VALUES (v_user_id, 'Sample Intern', 'intern@example.com', '09170000001', 'BS Information Technology', 'Sample University', 'cv.pdf', 'portfolio.pdf', 'required', 480, 'LinkedIn', 'accepted', '2026-04-01', 'Q2-2026', 'IT', 'To be assigned', 'Mon-Fri, 8:00 AM - 5:00 PM', '2026-04-15', '{"offer_letter":"submitted"}'::jsonb, '[{"id":"sd_001","name":"Endorsement Letter","fileName":"endorsement.pdf","status":"submitted","signedBy":null}]'::jsonb, '2026-04-05', '10:00', '2026-04-10', '14:00', FALSE, NULL, NULL, '2026-04-01T00:00:00Z')
                    RETURNING id INTO v_app_id;
                END IF;
            ELSE
                -- Update existing application to ensure fields are current
                IF v_col_type = 'uuid' THEN
                    IF v_user_id_uuid IS NOT NULL THEN
                        UPDATE applications SET
                            user_id = v_user_id_uuid,
                            name = 'Sample Intern',
                            phone = '09170000001',
                            course = 'BS Information Technology',
                            school = 'Sample University',
                            cv_name = 'cv.pdf',
                            cover_name = 'portfolio.pdf',
                            ojt_type = 'required',
                            hours_required = 480,
                            source = 'LinkedIn',
                            status = 'accepted',
                            quarter = 'Q2-2026',
                            department = 'IT',
                            supervisor = 'To be assigned',
                            schedule = 'Mon-Fri, 8:00 AM - 5:00 PM',
                            start_date = '2026-04-15',
                            company_docs = '{"offer_letter":"submitted"}'::jsonb,
                            school_docs = '[{"id":"sd_001","name":"Endorsement Letter","fileName":"endorsement.pdf","status":"submitted","signedBy":null}]'::jsonb,
                            interview_date = '2026-04-05',
                            interview_time = '10:00',
                            final_interview_date = '2026-04-10',
                            final_interview_time = '14:00',
                            is_deployed = FALSE,
                            withdraw_reason = NULL,
                            created_by = NULL,
                            created_at = '2026-04-01T00:00:00Z'
                        WHERE id = v_app_id;
                    ELSE
                        UPDATE applications SET
                            name = 'Sample Intern',
                            phone = '09170000001',
                            course = 'BS Information Technology',
                            school = 'Sample University',
                            cv_name = 'cv.pdf',
                            cover_name = 'portfolio.pdf',
                            ojt_type = 'required',
                            hours_required = 480,
                            source = 'LinkedIn',
                            status = 'accepted',
                            quarter = 'Q2-2026',
                            department = 'IT',
                            supervisor = 'To be assigned',
                            schedule = 'Mon-Fri, 8:00 AM - 5:00 PM',
                            start_date = '2026-04-15',
                            company_docs = '{"offer_letter":"submitted"}'::jsonb,
                            school_docs = '[{"id":"sd_001","name":"Endorsement Letter","fileName":"endorsement.pdf","status":"submitted","signedBy":null}]'::jsonb,
                            interview_date = '2026-04-05',
                            interview_time = '10:00',
                            final_interview_date = '2026-04-10',
                            final_interview_time = '14:00',
                            is_deployed = FALSE,
                            withdraw_reason = NULL,
                            created_by = NULL,
                            created_at = '2026-04-01T00:00:00Z'
                        WHERE id = v_app_id;
                    END IF;
                ELSE
                    UPDATE applications SET
                        user_id = v_user_id,
                        name = 'Sample Intern',
                        phone = '09170000001',
                        course = 'BS Information Technology',
                        school = 'Sample University',
                        cv_name = 'cv.pdf',
                        cover_name = 'portfolio.pdf',
                        ojt_type = 'required',
                        hours_required = 480,
                        source = 'LinkedIn',
                        status = 'accepted',
                        quarter = 'Q2-2026',
                        department = 'IT',
                        supervisor = 'To be assigned',
                        schedule = 'Mon-Fri, 8:00 AM - 5:00 PM',
                        start_date = '2026-04-15',
                        company_docs = '{"offer_letter":"submitted"}'::jsonb,
                        school_docs = '[{"id":"sd_001","name":"Endorsement Letter","fileName":"endorsement.pdf","status":"submitted","signedBy":null}]'::jsonb,
                        interview_date = '2026-04-05',
                        interview_time = '10:00',
                        final_interview_date = '2026-04-10',
                        final_interview_time = '14:00',
                        is_deployed = FALSE,
                        withdraw_reason = NULL,
                        created_by = NULL,
                        created_at = '2026-04-01T00:00:00Z'
                    WHERE id = v_app_id;
                END IF;
            END IF;

            -- DTR ENTRIES (idempotent)
            INSERT INTO dtr_entries (id, app_id, date, time_in, time_out, type, created_by, created_at)
            VALUES ('44444444-4444-4444-4444-444444444444', v_app_id, '2026-04-16', '08:00', '17:00', 'work', NULL, '2026-04-01T00:00:00Z')
            ON CONFLICT (id) DO UPDATE SET
                app_id = EXCLUDED.app_id,
                date = EXCLUDED.date,
                time_in = EXCLUDED.time_in,
                time_out = EXCLUDED.time_out,
                type = EXCLUDED.type,
                created_by = EXCLUDED.created_by,
                created_at = EXCLUDED.created_at;

            -- SCHOOL ACTIVITIES (idempotent)
            INSERT INTO school_activities (id, app_id, name, description, status, type, created_by, created_at)
            VALUES ('55555555-5555-5555-5555-555555555555', v_app_id, 'Career Talk', 'School activity', 'approved', 'school', NULL, '2026-04-01T00:00:00Z')
            ON CONFLICT (id) DO UPDATE SET
                app_id = EXCLUDED.app_id,
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                status = EXCLUDED.status,
                type = EXCLUDED.type,
                created_by = EXCLUDED.created_by,
                created_at = EXCLUDED.created_at;

            -- MESSAGES (idempotent)
            INSERT INTO messages (id, app_id, sender, text, time, read, created_by, created_at)
            VALUES ('66666666-6666-6666-6666-666666666666', v_app_id, 'hr', 'Welcome to PRIME!', '2026-04-16T09:00:00Z', FALSE, NULL, '2026-04-01T00:00:00Z')
            ON CONFLICT (id) DO UPDATE SET
                app_id = EXCLUDED.app_id,
                sender = EXCLUDED.sender,
                text = EXCLUDED.text,
                time = EXCLUDED.time,
                read = EXCLUDED.read,
                created_by = EXCLUDED.created_by,
                created_at = EXCLUDED.created_at;

        END
        $$;

    -- EMAIL TEMPLATES
    INSERT INTO email_templates (id, name, subject, body, created_by, created_at)
    VALUES
    ('tmpl_initial_interview', 'Initial Interview', 'Interview Schedule', 'Hello {name}, your interview is on {date} at {time}.', NULL, '2026-04-01T00:00:00Z')
    ON CONFLICT (id) DO UPDATE
    SET
    name = EXCLUDED.name,
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    created_by = EXCLUDED.created_by,
    created_at = EXCLUDED.created_at;

    -- COMPANY DOCUMENTS
    INSERT INTO company_documents (id, name, description, type, created_by, created_at)
    VALUES
    ('offer_letter', 'Offer Letter', 'Signed offer letter', 'company', NULL, '2026-04-01T00:00:00Z')
    ON CONFLICT (id) DO UPDATE
    SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    created_by = EXCLUDED.created_by,
    created_at = EXCLUDED.created_at;

    -- DEPT SLOTS
    INSERT INTO dept_slots (department, slots, created_by, created_at)
    VALUES
    ('IT', 3, NULL, '2026-04-01T00:00:00Z'),
    ('HR', 1, NULL, '2026-04-01T00:00:00Z')
    ON CONFLICT (department) DO UPDATE SET
    slots = EXCLUDED.slots,
    created_by = EXCLUDED.created_by,
    created_at = EXCLUDED.created_at;

    -- QUARTER SETTINGS
    INSERT INTO quarter_settings (id, current, created_by, created_at)
    VALUES
    (1, 'Q2-2026', NULL, '2026-04-01T00:00:00Z')
    ON CONFLICT (id) DO UPDATE SET
    current = EXCLUDED.current,
    created_by = EXCLUDED.created_by,
    created_at = EXCLUDED.created_at;
