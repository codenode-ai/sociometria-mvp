DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT id
    FROM auth.users
  LOOP
    PERFORM auth.delete_user(user_record.id);
  END LOOP;

  DELETE FROM sociometria.user_profiles;
END;
$$;
