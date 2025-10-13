BEGIN;

SET search_path TO sociometria, public;

CREATE TYPE sociometria.user_role AS ENUM ('admin', 'user');

CREATE TABLE IF NOT EXISTS sociometria.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role sociometria.user_role NOT NULL DEFAULT 'user',
  display_name text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE OR REPLACE FUNCTION sociometria.touch_user_profile()
RETURNS trigger LANGUAGE plpgsql AS 
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON sociometria.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON sociometria.user_profiles
FOR EACH ROW EXECUTE FUNCTION sociometria.touch_user_profile();

CREATE OR REPLACE FUNCTION sociometria.create_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = sociometria, public AS 
BEGIN
  INSERT INTO sociometria.user_profiles(user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
;

DROP TRIGGER IF EXISTS trg_auth_users_insert_profile ON auth.users;
CREATE TRIGGER trg_auth_users_insert_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION sociometria.create_user_profile();

ALTER TABLE sociometria.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sociometria.user_profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_profiles_service_role_all ON sociometria.user_profiles;
CREATE POLICY user_profiles_service_role_all ON sociometria.user_profiles
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS user_profiles_self_select ON sociometria.user_profiles;
CREATE POLICY user_profiles_self_select ON sociometria.user_profiles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_profiles_admin_update_role ON sociometria.user_profiles;
CREATE POLICY user_profiles_admin_update_role ON sociometria.user_profiles
  FOR UPDATE USING (EXISTS (
    SELECT 1
    FROM sociometria.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'admin'
  )) WITH CHECK (true);

CREATE OR REPLACE FUNCTION sociometria.current_user_role()
RETURNS sociometria.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = sociometria, public
AS 
  SELECT role FROM sociometria.user_profiles WHERE user_id = auth.uid();
;

GRANT EXECUTE ON FUNCTION sociometria.current_user_role() TO authenticated, service_role;

DROP POLICY IF EXISTS tests_authenticated_read ON sociometria.psychological_tests;
CREATE POLICY tests_authenticated_read ON sociometria.psychological_tests
  FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));

DROP POLICY IF EXISTS test_versions_authenticated_read ON sociometria.psychological_test_versions;
CREATE POLICY test_versions_authenticated_read ON sociometria.psychological_test_versions
  FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));

DROP POLICY IF EXISTS test_questions_authenticated_read ON sociometria.psychological_test_questions;
CREATE POLICY test_questions_authenticated_read ON sociometria.psychological_test_questions
  FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));

DROP POLICY IF EXISTS test_options_authenticated_read ON sociometria.psychological_test_options;
CREATE POLICY test_options_authenticated_read ON sociometria.psychological_test_options
  FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));

DROP POLICY IF EXISTS test_bands_authenticated_read ON sociometria.psychological_test_interpretation_bands;
CREATE POLICY test_bands_authenticated_read ON sociometria.psychological_test_interpretation_bands
  FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));

GRANT EXECUTE ON FUNCTION sociometria.get_psychological_tests() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION sociometria.get_psychological_test(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION sociometria.create_psychological_test(jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION sociometria.update_psychological_test(uuid, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION sociometria.delete_psychological_test(uuid) FROM authenticated;

GRANT EXECUTE ON FUNCTION sociometria.create_psychological_test(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION sociometria.update_psychological_test(uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION sociometria.delete_psychological_test(uuid) TO service_role;

COMMIT;
