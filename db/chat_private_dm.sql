-- Private 1:1 chat between a service worker and the admin.
-- Channel convention: 'dm-<service_profile_id>'. Run once in Supabase. Safe to re-run.
--
-- Tightens the chat read/insert policies so dm-* channels are visible/writable
-- only to the admin and to the service worker who owns that channel. Regular
-- channels (general / announcements) keep their previous behavior.

-- The channel CHECK constraint only allowed general/announcements; widen it to
-- also permit dm-* channels (otherwise inserts fail with chat_messages_channel_check).
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_channel_check;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_channel_check
  CHECK (channel IN ('general', 'announcements') OR channel LIKE 'dm-%');

DROP POLICY IF EXISTS "chat read all" ON chat_messages;
CREATE POLICY "chat read all" ON chat_messages
  FOR SELECT TO authenticated
  USING (
    channel NOT LIKE 'dm-%'
    OR current_user_role() = 'admin'
    OR channel = 'dm-' || auth.uid()::text
  );

DROP POLICY IF EXISTS "chat insert" ON chat_messages;
CREATE POLICY "chat insert" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    AND (
      channel = 'general'
      OR (channel = 'announcements' AND current_user_role() IN ('admin', 'service'))
      OR (
        channel LIKE 'dm-%'
        AND (current_user_role() = 'admin' OR channel = 'dm-' || auth.uid()::text)
      )
    )
  );
