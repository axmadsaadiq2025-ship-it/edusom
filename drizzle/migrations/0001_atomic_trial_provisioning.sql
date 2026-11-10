CREATE OR REPLACE FUNCTION public.reserve_school_trial(_id uuid, _payload jsonb, _limit_key text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE k text; a integer;
BEGIN
 FOR k IN SELECT unnest(ARRAY['global',_limit_key,'email:'||encode(digest(lower(_payload->>'adminEmail'),'sha256'),'hex')]) LOOP
 INSERT INTO public.trial_registration_limits(key,attempts) VALUES(k,1) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN trial_registration_limits.window_started_at<=now()-interval '1 hour' THEN 1 ELSE trial_registration_limits.attempts+1 END,window_started_at=CASE WHEN trial_registration_limits.window_started_at<=now()-interval '1 hour' THEN now() ELSE trial_registration_limits.window_started_at END RETURNING attempts INTO a;
 IF a > (CASE WHEN k='global' THEN 100 ELSE 5 END) THEN RETURN NULL; END IF;
 END LOOP;
 PERFORM pg_advisory_xact_lock(hashtextextended(lower(_payload->>'schoolEmail'),0));
 IF EXISTS(SELECT 1 FROM public.super_admin_seeds WHERE lower(email)=lower(_payload->>'adminEmail')) THEN RAISE EXCEPTION 'This administrator email cannot be used for trial registration'; END IF;
 IF EXISTS(SELECT 1 FROM public.schools WHERE lower(email)=lower(_payload->>'schoolEmail')) OR EXISTS(SELECT 1 FROM public.school_registration_requests WHERE lower(school_email)=lower(_payload->>'schoolEmail') OR lower(admin_email)=lower(_payload->>'adminEmail')) THEN RAISE EXCEPTION 'A school or access request already exists for this email'; END IF;
 DELETE FROM public.trial_registrations WHERE school_id IS NULL AND created_at<now()-interval '10 minutes';
 INSERT INTO public.trial_registrations(id,school_email,admin_email,payload) VALUES(_id,lower(_payload->>'schoolEmail'),lower(_payload->>'adminEmail'),_payload);
 RETURN _id;
END $$;
REVOKE ALL ON FUNCTION public.reserve_school_trial(uuid,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_school_trial(uuid,jsonb,text) TO service_role;
CREATE OR REPLACE FUNCTION public.provision_school_trial() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.trial_registrations; sid uuid; t timestamptz:=clock_timestamp(); y integer;
BEGIN
 IF NEW.raw_user_meta_data->>'trial_token' IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO r FROM public.trial_registrations WHERE id::text=NEW.raw_user_meta_data->>'trial_token' AND admin_email=lower(NEW.email) AND school_id IS NULL AND created_at>now()-interval '10 minutes' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid or expired trial registration'; END IF;
 IF EXISTS(SELECT 1 FROM public.super_admin_seeds WHERE lower(email)=lower(NEW.email)) OR EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=NEW.id AND role='super_admin') THEN RAISE EXCEPTION 'Privileged accounts cannot be provisioned by trial signup'; END IF;
 INSERT INTO public.schools(name,slug,email,phone,school_type,website,address,country,city,school_code,plan,subscription_status,is_active,trial_started_at,trial_expires_at) VALUES(r.payload->>'schoolName','trial-'||r.id::text,r.school_email,r.payload->>'schoolPhone',(r.payload->>'schoolType')::public.school_type,NULLIF(r.payload->>'website',''),NULLIF(r.payload->>'address',''),r.payload->>'country',r.payload->>'city','EDU-'||upper(substr(replace(r.id::text,'-',''),1,12)),'professional','trialing',true,t,t+interval '168 hours') RETURNING id INTO sid;
 INSERT INTO public.profiles(id,school_id,full_name,email,phone,is_active) VALUES(NEW.id,sid,r.payload->>'adminFullName',NEW.email,r.payload->>'adminPhone',true) ON CONFLICT(id) DO UPDATE SET school_id=excluded.school_id,full_name=excluded.full_name,phone=excluded.phone,is_active=true;
 INSERT INTO public.user_roles(user_id,school_id,role) VALUES(NEW.id,sid,'school_owner');
 y:=extract(year from t)::integer; IF extract(month from t)<8 THEN y:=y-1; END IF;
 INSERT INTO public.academic_years(school_id,name,start_date,end_date,is_current) VALUES(sid,y::text||'/'||(y+1)::text,make_date(y,9,1),make_date(y+1,6,30),true);
 UPDATE public.trial_registrations SET school_id=sid,user_id=NEW.id WHERE id=r.id;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.provision_school_trial() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER on_trial_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.provision_school_trial();