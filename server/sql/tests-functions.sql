BEGIN;

SET search_path TO sociometria, public;

CREATE OR REPLACE FUNCTION sociometria.serialize_psychological_test(p_test_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
AS 
WITH test_row AS (
  SELECT t.*, lv.id AS version_id, lv.version_number
  FROM sociometria.psychological_tests t
  JOIN LATERAL (
    SELECT v.*
    FROM sociometria.psychological_test_versions v
    WHERE v.test_id = t.id
    ORDER BY v.version_number DESC
    LIMIT 1
  ) lv ON true
  WHERE t.id = p_test_id
)
SELECT jsonb_build_object(
  'id', tr.id,
  'slug', tr.slug,
  'title', tr.title,
  'description', tr.description,
  'language', tr.default_language,
  'availableLanguages', tr.available_languages,
  'status', tr.status,
  'tags', tr.tags,
  'estimatedDurationMinutes', tr.estimated_duration_minutes,
  'createdAt', tr.created_at,
  'updatedAt', tr.updated_at,
  'version', tr.version_number,
  'history', (
    SELECT jsonb_agg(jsonb_build_object(
      'version', v.version_number,
      'note', v.note,
      'author', v.author,
      'createdAt', v.created_at
    ) ORDER BY v.version_number)
    FROM sociometria.psychological_test_versions v
    WHERE v.test_id = tr.id
  ),
  'questions', (
    SELECT jsonb_agg(jsonb_build_object(
      'id', q.id,
      'questionKey', coalesce(q.question_key, format('q%02s', q.position)),
      'prompt', q.prompt,
      'dimension', q.dimension,
      'helpText', q.help_text,
      'position', q.position,
      'options', (
        SELECT jsonb_agg(jsonb_build_object(
          'id', o.id,
          'weight', o.weight,
          'label', o.label
        ) ORDER BY o.weight)
        FROM sociometria.psychological_test_options o
        WHERE o.question_id = q.id
      )
    ) ORDER BY q.position)
    FROM sociometria.psychological_test_questions q
    WHERE q.version_id = tr.version_id
  ),
  'interpretationBands', (
    SELECT jsonb_agg(jsonb_build_object(
      'id', b.id,
      'bandKey', b.band_key,
      'label', b.label,
      'description', b.description,
      'color', b.color,
      'min', b.min_score,
      'max', b.max_score
    ) ORDER BY b.min_score)
    FROM sociometria.psychological_test_interpretation_bands b
    WHERE b.version_id = tr.version_id
  )
)
FROM test_row tr;
;

CREATE OR REPLACE FUNCTION sociometria.get_psychological_tests()
RETURNS SETOF jsonb
LANGUAGE sql
STABLE
AS 
  SELECT sociometria.serialize_psychological_test(t.id)
  FROM sociometria.psychological_tests t
  ORDER BY t.created_at DESC;
;

CREATE OR REPLACE FUNCTION sociometria.get_psychological_test(p_test_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
AS 
  SELECT sociometria.serialize_psychological_test(p_test_id);
;

CREATE OR REPLACE FUNCTION sociometria.create_psychological_test(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sociometria, public
AS 
DECLARE
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
  v_title text;
  v_description text;
  v_language sociometria.supported_language_enum;
  v_available_languages sociometria.supported_language_enum[];
  v_status sociometria.test_status_enum;
  v_tags text[];
  v_estimated_duration integer;
  v_history_note text;
  v_author text;
  v_slug_base text;
  v_slug text;
  v_counter integer := 1;
  v_test_id uuid;
  v_version_id uuid;
  v_question_elem jsonb;
  v_question_index integer := 0;
  v_question_id uuid;
  v_option_elem jsonb;
  v_option_weight integer;
  v_band_elem jsonb;
  v_min_score integer;
  v_max_score integer;
BEGIN
  v_title := trim(coalesce(v_payload->>'title', ''));
  v_description := trim(coalesce(v_payload->>'description', ''));
  IF v_title = '' OR v_description = '' THEN
    RAISE EXCEPTION 'Title and description are required';
  END IF;

  v_language := coalesce((v_payload->>'language')::sociometria.supported_language_enum, 'pt');
  v_available_languages := ARRAY(
    SELECT DISTINCT value::sociometria.supported_language_enum
    FROM jsonb_array_elements_text(v_payload->'availableLanguages')
  );
  IF array_length(v_available_languages, 1) IS NULL THEN
    v_available_languages := ARRAY[v_language];
  ELSIF NOT v_language = ANY(v_available_languages) THEN
    v_available_languages := array_append(v_available_languages, v_language);
  END IF;

  v_status := coalesce((v_payload->>'status')::sociometria.test_status_enum, 'draft');
  v_estimated_duration := (v_payload->>'estimatedDurationMinutes')::integer;
  v_history_note := nullif(trim(coalesce(v_payload->>'historyNote', 'Manual creation')), '');
  v_author := nullif(trim(coalesce(v_payload->>'author', '')), '');

  v_tags := ARRAY(
    SELECT trim(value)
    FROM jsonb_array_elements_text(v_payload->'tags') value
    WHERE trim(value) <> ''
  );
  IF array_length(v_tags, 1) IS NULL THEN
    v_tags := ARRAY[]::text[];
  END IF;

  IF jsonb_typeof(v_payload->'questions') <> 'array' THEN
    RAISE EXCEPTION '"questions" must be an array';
  END IF;
  IF jsonb_array_length(v_payload->'questions') <> 10 THEN
    RAISE EXCEPTION 'A psychological test must contain exactly 10 questions';
  END IF;

  IF jsonb_typeof(v_payload->'interpretationBands') <> 'array' OR jsonb_array_length(v_payload->'interpretationBands') = 0 THEN
    RAISE EXCEPTION 'At least one interpretation band is required';
  END IF;

  v_slug_base := regexp_replace(lower(v_title), '[^a-z0-9]+', '-', 'g');
  v_slug_base := regexp_replace(v_slug_base, '(^-+|-+$)', '', 'g');
  IF v_slug_base = '' THEN
    v_slug_base := 'test';
  END IF;
  v_slug := v_slug_base;

  WHILE EXISTS (SELECT 1 FROM sociometria.psychological_tests WHERE slug = v_slug) LOOP
    v_slug := v_slug_base || '-' || to_char(v_counter, 'FM00');
    v_counter := v_counter + 1;
  END LOOP;

  INSERT INTO sociometria.psychological_tests (
    slug,
    title,
    description,
    default_language,
    available_languages,
    status,
    tags,
    estimated_duration_minutes
  )
  VALUES (
    v_slug,
    v_title,
    v_description,
    v_language,
    v_available_languages,
    v_status,
    v_tags,
    v_estimated_duration
  )
  RETURNING id INTO v_test_id;

  INSERT INTO sociometria.psychological_test_versions (
    test_id,
    version_number,
    note,
    author
  )
  VALUES (
    v_test_id,
    1,
    v_history_note,
    v_author
  )
  RETURNING id INTO v_version_id;

  FOR v_question_index IN 0 .. jsonb_array_length(v_payload->'questions') - 1 LOOP
    v_question_elem := (v_payload->'questions')->v_question_index;
    IF coalesce(trim(v_question_elem->>'prompt'), '') = '' THEN
      RAISE EXCEPTION 'Question % must contain a prompt', v_question_index + 1;
    END IF;

    INSERT INTO sociometria.psychological_test_questions (
      version_id,
      question_key,
      prompt,
      dimension,
      help_text,
      position
    )
    VALUES (
      v_version_id,
      coalesce(v_question_elem->>'questionKey', format('q%02s', v_question_index + 1)),
      trim(v_question_elem->>'prompt'),
      nullif(trim(coalesce(v_question_elem->>'dimension', '')),''),
      nullif(trim(coalesce(v_question_elem->>'helpText', '')),''),
      v_question_index + 1
    )
    RETURNING id INTO v_question_id;

    IF jsonb_typeof(v_question_elem->'options') <> 'array' OR jsonb_array_length(v_question_elem->'options') = 0 THEN
      RAISE EXCEPTION 'Question % must include options', v_question_index + 1;
    END IF;

    FOR v_option_elem IN SELECT value FROM jsonb_array_elements(v_question_elem->'options') LOOP
      v_option_weight := (v_option_elem->>'weight')::integer;
      IF v_option_weight IS NULL OR v_option_weight < 1 OR v_option_weight > 4 THEN
        RAISE EXCEPTION 'Invalid option weight for question %', v_question_index + 1;
      END IF;

      INSERT INTO sociometria.psychological_test_options (
        question_id,
        weight,
        label
      )
      VALUES (
        v_question_id,
        v_option_weight,
        trim(coalesce(v_option_elem->>'label', ''))
      );
    END LOOP;
  END LOOP;

  FOR v_band_elem IN SELECT value FROM jsonb_array_elements(v_payload->'interpretationBands') LOOP
    v_min_score := (v_band_elem->>'min')::integer;
    v_max_score := (v_band_elem->>'max')::integer;
    IF v_min_score IS NULL OR v_max_score IS NULL THEN
      RAISE EXCEPTION 'Interpretation band must define min and max';
    END IF;

    INSERT INTO sociometria.psychological_test_interpretation_bands (
      version_id,
      band_key,
      label,
      description,
      color,
      min_score,
      max_score
    )
    VALUES (
      v_version_id,
      coalesce(v_band_elem->>'bandKey', format('band-%s', gen_random_uuid())),
      trim(coalesce(v_band_elem->>'label', '')),
      nullif(trim(coalesce(v_band_elem->>'description', '')),''),
      nullif(trim(coalesce(v_band_elem->>'color', '')),''),
      v_min_score,
      v_max_score
    );
  END LOOP;

  RETURN sociometria.serialize_psychological_test(v_test_id);
END;
;

CREATE OR REPLACE FUNCTION sociometria.update_psychological_test(p_test_id uuid, p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sociometria, public
AS 
DECLARE
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
  v_existing sociometria.psychological_tests%ROWTYPE;
  v_title text;
  v_description text;
  v_language sociometria.supported_language_enum;
  v_available_languages sociometria.supported_language_enum[];
  v_status sociometria.test_status_enum;
  v_tags text[];
  v_estimated_duration integer;
  v_history_note text;
  v_author text;
  v_slug_base text;
  v_slug text;
  v_counter integer := 1;
  v_next_version integer;
  v_version_id uuid;
  v_question_elem jsonb;
  v_question_index integer := 0;
  v_question_id uuid;
  v_option_elem jsonb;
  v_option_weight integer;
  v_band_elem jsonb;
  v_min_score integer;
  v_max_score integer;
BEGIN
  SELECT * INTO v_existing FROM sociometria.psychological_tests WHERE id = p_test_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Psychological test % not found', p_test_id;
  END IF;

  v_title := trim(coalesce(v_payload->>'title', v_existing.title));
  v_description := trim(coalesce(v_payload->>'description', v_existing.description));
  v_language := coalesce((v_payload->>'language')::sociometria.supported_language_enum, v_existing.default_language);

  v_available_languages := ARRAY(
    SELECT DISTINCT value::sociometria.supported_language_enum
    FROM jsonb_array_elements_text(v_payload->'availableLanguages')
  );
  IF array_length(v_available_languages, 1) IS NULL THEN
    v_available_languages := v_existing.available_languages;
  ELSIF NOT v_language = ANY(v_available_languages) THEN
    v_available_languages := array_append(v_available_languages, v_language);
  END IF;

  v_status := coalesce((v_payload->>'status')::sociometria.test_status_enum, v_existing.status);
  v_estimated_duration := coalesce((v_payload->>'estimatedDurationMinutes')::integer, v_existing.estimated_duration_minutes);
  v_history_note := nullif(trim(coalesce(v_payload->>'historyNote', 'Manual update')), '');
  v_author := nullif(trim(coalesce(v_payload->>'author', '')), '');

  IF v_payload ? 'tags' THEN
    v_tags := ARRAY(
      SELECT trim(value)
      FROM jsonb_array_elements_text(v_payload->'tags') value
      WHERE trim(value) <> ''
    );
  ELSE
    v_tags := v_existing.tags;
  END IF;
  IF array_length(v_tags, 1) IS NULL THEN
    v_tags := ARRAY[]::text[];
  END IF;

  IF jsonb_typeof(v_payload->'questions') <> 'array' THEN
    RAISE EXCEPTION '"questions" must be an array';
  END IF;
  IF jsonb_array_length(v_payload->'questions') <> 10 THEN
    RAISE EXCEPTION 'A psychological test must contain exactly 10 questions';
  END IF;

  IF jsonb_typeof(v_payload->'interpretationBands') <> 'array' OR jsonb_array_length(v_payload->'interpretationBands') = 0 THEN
    RAISE EXCEPTION 'At least one interpretation band is required';
  END IF;

  v_slug_base := regexp_replace(lower(v_title), '[^a-z0-9]+', '-', 'g');
  v_slug_base := regexp_replace(v_slug_base, '(^-+|-+$)', '', 'g');
  IF v_slug_base = '' THEN
    v_slug_base := 'test';
  END IF;
  v_slug := v_slug_base;

  WHILE EXISTS (SELECT 1 FROM sociometria.psychological_tests WHERE slug = v_slug AND id <> p_test_id) LOOP
    v_slug := v_slug_base || '-' || to_char(v_counter, 'FM00');
    v_counter := v_counter + 1;
  END LOOP;

  UPDATE sociometria.psychological_tests
  SET
    slug = v_slug,
    title = v_title,
    description = v_description,
    default_language = v_language,
    available_languages = v_available_languages,
    status = v_status,
    tags = v_tags,
    estimated_duration_minutes = v_estimated_duration,
    updated_at = timezone('utc', now())
  WHERE id = p_test_id;

  SELECT coalesce(max(version_number), 0) + 1 INTO v_next_version
  FROM sociometria.psychological_test_versions
  WHERE test_id = p_test_id;

  INSERT INTO sociometria.psychological_test_versions (
    test_id,
    version_number,
    note,
    author
  )
  VALUES (
    p_test_id,
    v_next_version,
    v_history_note,
    v_author
  )
  RETURNING id INTO v_version_id;

  FOR v_question_index IN 0 .. jsonb_array_length(v_payload->'questions') - 1 LOOP
    v_question_elem := (v_payload->'questions')->v_question_index;
    IF coalesce(trim(v_question_elem->>'prompt'), '') = '' THEN
      RAISE EXCEPTION 'Question % must contain a prompt', v_question_index + 1;
    END IF;

    INSERT INTO sociometria.psychological_test_questions (
      version_id,
      question_key,
      prompt,
      dimension,
      help_text,
      position
    )
    VALUES (
      v_version_id,
      coalesce(v_question_elem->>'questionKey', format('q%02s', v_question_index + 1)),
      trim(v_question_elem->>'prompt'),
      nullif(trim(coalesce(v_question_elem->>'dimension', '')),''),
      nullif(trim(coalesce(v_question_elem->>'helpText', '')),''),
      v_question_index + 1
    )
    RETURNING id INTO v_question_id;

    IF jsonb_typeof(v_question_elem->'options') <> 'array' OR jsonb_array_length(v_question_elem->'options') = 0 THEN
      RAISE EXCEPTION 'Question % must include options', v_question_index + 1;
    END IF;

    FOR v_option_elem IN SELECT value FROM jsonb_array_elements(v_question_elem->'options') LOOP
      v_option_weight := (v_option_elem->>'weight')::integer;
      IF v_option_weight IS NULL OR v_option_weight < 1 OR v_option_weight > 4 THEN
        RAISE EXCEPTION 'Invalid option weight for question %', v_question_index + 1;
      END IF;

      INSERT INTO sociometria.psychological_test_options (
        question_id,
        weight,
        label
      )
      VALUES (
        v_question_id,
        v_option_weight,
        trim(coalesce(v_option_elem->>'label', ''))
      );
    END LOOP;
  END LOOP;

  FOR v_band_elem IN SELECT value FROM jsonb_array_elements(v_payload->'interpretationBands') LOOP
    v_min_score := (v_band_elem->>'min')::integer;
    v_max_score := (v_band_elem->>'max')::integer;
    IF v_min_score IS NULL OR v_max_score IS NULL THEN
      RAISE EXCEPTION 'Interpretation band must define min and max';
    END IF;

    INSERT INTO sociometria.psychological_test_interpretation_bands (
      version_id,
      band_key,
      label,
      description,
      color,
      min_score,
      max_score
    )
    VALUES (
      v_version_id,
      coalesce(v_band_elem->>'bandKey', format('band-%s', gen_random_uuid())),
      trim(coalesce(v_band_elem->>'label', '')),
      nullif(trim(coalesce(v_band_elem->>'description', '')),''),
      nullif(trim(coalesce(v_band_elem->>'color', '')),''),
      v_min_score,
      v_max_score
    );
  END LOOP;

  RETURN sociometria.serialize_psychological_test(p_test_id);
END;
;

CREATE OR REPLACE FUNCTION sociometria.delete_psychological_test(p_test_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sociometria, public
AS 
BEGIN
  DELETE FROM sociometria.psychological_tests WHERE id = p_test_id;
END;
;

GRANT EXECUTE ON FUNCTION sociometria.get_psychological_tests() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION sociometria.get_psychological_test(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION sociometria.create_psychological_test(jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION sociometria.update_psychological_test(uuid, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION sociometria.delete_psychological_test(uuid) TO authenticated, service_role;

COMMIT;
