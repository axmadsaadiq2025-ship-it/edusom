CREATE OR REPLACE FUNCTION public.school_operational_access(_school_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.is_super_admin(auth.uid()) OR EXISTS(SELECT 1 FROM public.schools s WHERE s.id=_school_id AND s.is_active AND (s.trial_started_at IS NULL OR s.subscription_status='active' OR (s.subscription_status='trialing' AND s.trial_expires_at>now()))); $$;
REVOKE ALL ON FUNCTION public.school_operational_access(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.school_operational_access(uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.protect_school_subscription() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF auth.uid() IS NOT NULL AND coalesce(auth.role(),'')<>'service_role' AND NOT public.is_super_admin(auth.uid()) AND (NEW.plan IS DISTINCT FROM OLD.plan OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status OR NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at OR NEW.trial_expires_at IS DISTINCT FROM OLD.trial_expires_at OR NEW.trial_converted_at IS DISTINCT FROM OLD.trial_converted_at OR NEW.is_active IS DISTINCT FROM OLD.is_active) THEN RAISE EXCEPTION 'Only platform administrators can change subscription access'; END IF;
 RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.protect_school_subscription() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER protect_school_subscription BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.protect_school_subscription();
DO $$ DECLARE r record; expr text; BEGIN
 FOR r IN SELECT DISTINCT table_name FROM information_schema.columns WHERE table_schema='public' AND column_name='school_id' AND table_name NOT IN ('profiles','user_roles','school_registration_requests','trial_registrations','trial_notifications','subscription_upgrade_requests') LOOP
 EXECUTE format('CREATE POLICY trial_operational_access ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.school_operational_access(school_id)) WITH CHECK (public.school_operational_access(school_id))',r.table_name); END LOOP;
 FOR r IN SELECT * FROM (VALUES('attendance_records','attendance_sessions','session_id'),('fee_invoice_items','fee_invoices','invoice_id'),('fee_payments','fee_invoices','invoice_id'),('homework_submissions','homework','homework_id'),('student_parents','students','student_id')) AS x(child,parent,fk) LOOP
 expr:=format('EXISTS(SELECT 1 FROM public.%I p WHERE p.id=%I.%I AND public.school_operational_access(p.school_id))',r.parent,r.child,r.fk);
 EXECUTE format('CREATE POLICY trial_operational_access ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (%s) WITH CHECK (%s)',r.child,expr,expr); END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.refresh_school_trials() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 UPDATE public.schools SET subscription_status='expired' WHERE subscription_status='trialing' AND trial_expires_at<=now();
 INSERT INTO public.trial_notifications(school_id,milestone,message) SELECT id,m,CASE m WHEN 3 THEN 'Your EduSom trial has 3 days remaining. Choose a plan to keep your school running.' WHEN 1 THEN 'Your EduSom trial has 1 day remaining. Choose a plan before it expires.' ELSE 'Your EduSom trial has expired. Your school data is safe. Request subscription activation to continue.' END FROM public.schools CROSS JOIN (VALUES(3),(1),(0)) v(m) WHERE trial_started_at IS NOT NULL AND ((subscription_status='trialing' AND m>0 AND trial_expires_at<=now()+make_interval(days=>m)) OR (subscription_status='expired' AND m=0)) ON CONFLICT(school_id,milestone) DO NOTHING;
 END $$;
REVOKE ALL ON FUNCTION public.refresh_school_trials() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_school_trials() TO service_role;
CREATE OR REPLACE FUNCTION public.get_school_trial() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE s public.schools; BEGIN
 SELECT * INTO s FROM public.schools WHERE id=public.get_user_school(auth.uid()); IF NOT FOUND THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('schoolId',s.id,'schoolName',s.name,'status',CASE WHEN s.subscription_status='trialing' AND s.trial_expires_at<=now() THEN 'expired' ELSE s.subscription_status END,'plan',s.plan,'startedAt',s.trial_started_at,'expiresAt',s.trial_expires_at,'daysRemaining',CASE WHEN s.trial_expires_at IS NULL THEN 0 ELSE greatest(0,ceil(extract(epoch from (s.trial_expires_at-now()))/86400)) END,'allowed',s.is_active AND (s.trial_started_at IS NULL OR s.subscription_status='active' OR (s.subscription_status='trialing' AND s.trial_expires_at>now()))); END $$;
REVOKE ALL ON FUNCTION public.get_school_trial() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_school_trial() TO authenticated;
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$ BEGIN PERFORM cron.schedule('edusom-school-trial-lifecycle','0 * * * *','SELECT public.refresh_school_trials()'); END $$;