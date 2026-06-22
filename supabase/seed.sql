-- ============================================================
-- Qanoun Tech — Seed Data
-- Run AFTER the app_tables migration and AFTER at least one
-- user exists in next_auth.users (from signup flow).
--
-- This uses fixed UUIDs so it can be re-run idempotently.
-- In production, remove this file and let real data flow.
-- ============================================================

-- Helper: pick the first 3 users from next_auth.users to assign roles.
-- If no users exist yet, this seed will do nothing (safe).

DO $$
DECLARE
  v_client_id   uuid;
  v_lawyer_id   uuid;
  v_office_id   uuid;
  v_case1_id    uuid := 'a0000000-0000-0000-0000-000000000001';
  v_case2_id    uuid := 'a0000000-0000-0000-0000-000000000002';
  v_case3_id    uuid := 'a0000000-0000-0000-0000-000000000003';
  v_consult1_id uuid := 'b0000000-0000-0000-0000-000000000001';
  v_consult2_id uuid := 'b0000000-0000-0000-0000-000000000002';
  v_consult3_id uuid := 'b0000000-0000-0000-0000-000000000003';
BEGIN
  -- Get first user with role='client'
  SELECT id INTO v_client_id FROM next_auth.users WHERE role = 'client' LIMIT 1;
  -- Get first user with role='lawyer'
  SELECT id INTO v_lawyer_id FROM next_auth.users WHERE role = 'lawyer' LIMIT 1;
  -- Get first user with role='office'
  SELECT id INTO v_office_id FROM next_auth.users WHERE role = 'office' LIMIT 1;

  -- If we don't have at least a lawyer, use the first user for all
  IF v_lawyer_id IS NULL THEN
    SELECT id INTO v_lawyer_id FROM next_auth.users LIMIT 1;
  END IF;
  IF v_client_id IS NULL THEN
    v_client_id := v_lawyer_id;
  END IF;
  IF v_office_id IS NULL THEN
    v_office_id := v_lawyer_id;
  END IF;

  -- Skip if no users exist at all
  IF v_lawyer_id IS NULL THEN
    RAISE NOTICE 'No users found in next_auth.users — skipping seed.';
    RETURN;
  END IF;

  -- ------- PROFILES -------
  INSERT INTO public.profiles (user_id, type, specialization, specializations, city, bio, phone, rating, reviews_count, experience_years, cases_completed, response_time, verified, price_range, languages, lawyers_count, established_year)
  VALUES
    (v_lawyer_id, 'lawyer', 'قانون العمل والتأمينات', '{}', 'القاهرة',
     'محامي متخصص في قانون العمل والتأمينات الاجتماعية مع خبرة واسعة',
     '+20 100 111 2222', 4.9, 189, 15, 245, 'خلال ساعتين', true, 'متوسط',
     ARRAY['العربية', 'الإنجليزية'], 0, NULL),
    (v_office_id, 'office', 'قانون الشركات', ARRAY['قانون الشركات', 'قانون العمل', 'القانون التجاري'], 'القاهرة',
     'مكتب النور للمحاماة والاستشارات القانونية — خبرة تجاوزت 15 عاماً',
     '+20 100 333 4444', 4.8, 312, 15, 890, 'خلال 3 ساعات', true, 'عالي',
     ARRAY['العربية', 'الإنجليزية', 'الفرنسية'], 12, 2008),
    (v_client_id, 'client', NULL, '{}', 'الجيزة',
     NULL, '+20 100 555 6666', 0, 0, 0, 0, NULL, false, NULL, ARRAY['العربية'], 0, NULL)
  ON CONFLICT (user_id) DO NOTHING;

  -- ------- CASES -------
  INSERT INTO public.cases (id, case_number, title, description, category, status, priority, progress, client_id, lawyer_id, office_id, started_at, due_at)
  VALUES
    (v_case1_id, '2026-001', 'نزاع عقد عمل', 'فصل تعسفي بعد 5 سنوات خدمة — مطالبة بالتعويض', 'قانون العمل',
     'in_progress', 'high', 60, v_client_id, v_lawyer_id, v_office_id,
     NOW() - INTERVAL '14 days', NOW() + INTERVAL '30 days'),
    (v_case2_id, '2026-002', 'عقد إيجار تجاري', 'مراجعة وصياغة عقد إيجار لمحل تجاري', 'قانون العقارات',
     'review', 'normal', 85, v_client_id, v_lawyer_id, v_office_id,
     NOW() - INTERVAL '5 days', NOW() + INTERVAL '10 days'),
    (v_case3_id, '2026-003', 'تأسيس شركة ذات مسؤولية محدودة', 'إعداد الوثائق القانونية لتأسيس شركة جديدة', 'قانون الشركات',
     'pending', 'normal', 30, v_client_id, v_lawyer_id, v_office_id,
     NOW() - INTERVAL '7 days', NOW() + INTERVAL '45 days')
  ON CONFLICT (id) DO NOTHING;

  -- ------- TASKS -------
  INSERT INTO public.tasks (case_id, assigned_to, title, description, priority, completed, due_at)
  VALUES
    (v_case1_id, v_lawyer_id, 'تقديم طلب حكم عاجل', 'إعداد وتقديم طلب حكم عاجل في قضية نزاع العمل', 'high', false, NOW() + INTERVAL '1 day'),
    (v_case1_id, v_lawyer_id, 'التحضير لاجتماع العميل', 'مراجعة الملفات والتحضير لجلسة المشورة', 'normal', false, NOW() + INTERVAL '2 days'),
    (v_case2_id, v_lawyer_id, 'مراجعة والرد على طلبات الاكتشاف', 'مراجعة المستندات المطلوبة', 'normal', false, NOW() + INTERVAL '3 days'),
    (v_case3_id, v_lawyer_id, 'مسودة مقترح تسوية', 'صياغة مسودة أولية لمقترح التسوية', 'low', true, NOW() - INTERVAL '1 day'),
    (v_case1_id, v_lawyer_id, 'إعداد ملخص القضية', 'تلخيص وقائع القضية الأساسية', 'normal', true, NOW() - INTERVAL '2 days');

  -- ------- CONSULTATIONS -------
  INSERT INTO public.consultations (id, user_id, title, description, category, tags, views, likes, has_accepted_answer)
  VALUES
    (v_consult1_id, v_client_id,
     'ما هي حقوقي القانونية في حالة فصل تعسفي من العمل؟',
     'تم فصلي من عملي دون سابق إنذار بعد 5 سنوات من الخدمة. ما هي الخطوات القانونية التي يمكنني اتخاذها؟',
     'قانون العمل', ARRAY['فصل تعسفي', 'حقوق العمال', 'تعويضات'], 124, 15, true),
    (v_consult2_id, v_client_id,
     'كيف أسجل علامة تجارية لمشروعي الجديد؟',
     'أرغب في تسجيل علامة تجارية لمشروعي الناشئ. ما هي المتطلبات والإجراءات اللازمة؟',
     'قانون الملكية الفكرية', ARRAY['علامة تجارية', 'ملكية فكرية', 'مشاريع ناشئة'], 89, 22, true),
    (v_consult3_id, v_client_id,
     'هل يمكنني إلغاء عقد إيجار قبل انتهاء مدته؟',
     'وقعت عقد إيجار لمدة سنة ولكن اضطررت للانتقال. ما هي حقوقي والتزاماتي؟',
     'قانون العقارات', ARRAY['عقد إيجار', 'إلغاء عقد', 'عقارات'], 156, 31, false)
  ON CONFLICT (id) DO NOTHING;

  -- ------- CONSULTATION ANSWERS -------
  INSERT INTO public.consultation_answers (consultation_id, user_id, content, is_accepted, likes)
  VALUES
    (v_consult1_id, v_lawyer_id,
     'وفقاً لقانون العمل، يحق لك المطالبة بتعويض عن فترة الإنذار وبدل نهاية الخدمة. يُنصح بتوثيق كافة المراسلات مع صاحب العمل والتقدم بشكوى لمكتب العمل خلال مدة لا تتجاوز سنة.',
     true, 12),
    (v_consult1_id, v_lawyer_id,
     'إضافة لما ذكره الزميل، يحق لك أيضاً المطالبة بتعويض عن الأضرار المعنوية إذا ثبت أن الفصل كان تعسفياً.',
     false, 5),
    (v_consult2_id, v_lawyer_id,
     'لتسجيل علامة تجارية، تحتاج إلى: اختيار العلامة، التأكد من عدم وجود علامة مشابهة مسجلة، تقديم طلب التسجيل مع الرسوم المطلوبة. العملية عادة تستغرق من 3 إلى 6 أشهر.',
     true, 18);

  -- ------- BOOKINGS -------
  INSERT INTO public.bookings (client_id, lawyer_id, office_id, datetime, status, notes, location)
  VALUES
    (v_client_id, v_lawyer_id, NULL, NOW() + INTERVAL '2 days 14:00', 'confirmed', 'استشارة عميل', 'غرفة الاجتماعات أ'),
    (v_client_id, v_lawyer_id, NULL, NOW() + INTERVAL '3 days 16:00', 'pending', 'اجتماع لمراجعة القضية', 'مكالمة فيديو');

  -- ------- NOTIFICATIONS -------
  INSERT INTO public.notifications (user_id, type, title, description, reference_id)
  VALUES
    (v_client_id, 'document', 'تم توقيع مستند', 'عقد الإيجار التجاري', v_case2_id),
    (v_client_id, 'message', 'رسالة جديدة', 'من المحامي المسؤول عن قضيتك', NULL),
    (v_client_id, 'deadline', 'موعد نهائي قريب', 'مراجعة العقد خلال 3 أيام', v_case2_id),
    (v_lawyer_id, 'deadline', 'الموعد النهائي غداً', 'استحقاق الرد على طلبات الاكتشاف', v_case1_id),
    (v_lawyer_id, 'case_update', 'تم تحديد موعد المحكمة', 'جلسة قادمة في القضية', v_case1_id),
    (v_lawyer_id, 'document', 'تم تقديم المستند', 'تم تقديم الطلب بنجاح', v_case1_id),
    (v_office_id, 'case_update', 'تم تعيين قضية جديدة', 'استشارة اندماج شركات', v_case3_id),
    (v_office_id, 'payment', 'تم استلام الدفعة', 'فاتورة — 8,500$', NULL),
    (v_office_id, 'deadline', 'الموعد النهائي لتقديم المحكمة', 'قضية نزاع العمل', v_case1_id);

  -- ------- FINANCIALS (current month for office) -------
  INSERT INTO public.financials (office_id, month, billed_hours, revenue, expenses, other_income)
  VALUES
    (v_office_id, DATE_TRUNC('month', NOW()), 467.0, 98500.00, 12300.00, 37800.00)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed data inserted successfully!';
END $$;
