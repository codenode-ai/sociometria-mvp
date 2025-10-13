DO 
DECLARE
  v_user_record auth.users;
  v_email text := 'admin@sociometria.dev';
  v_password text := 'AdminTemp123!';
BEGIN
  SELECT * INTO v_user_record
  FROM auth.users
  WHERE email = v_email;

  IF v_user_record.id IS NULL THEN
    SELECT * INTO v_user_record
    FROM auth.create_user(
      email => v_email,
      password => v_password,
      email_confirm => true,
      user_metadata => jsonb_build_object('display_name', 'Administrador Sociometria')
    );
  END IF;

  UPDATE sociometria.user_profiles
  SET role = 'admin', display_name = coalesce(display_name, 'Administrador Sociometria')
  WHERE user_id = v_user_record.id;
END;
;

