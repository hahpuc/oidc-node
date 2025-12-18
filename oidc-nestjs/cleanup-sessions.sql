-- Clean up old sessions and interactions
DELETE FROM openiddict_tokens WHERE type IN ('Session', 'Interaction');

-- Verify cleanup
SELECT COUNT(*) as remaining_sessions FROM openiddict_tokens WHERE type = 'Session';
SELECT COUNT(*) as remaining_interactions FROM openiddict_tokens WHERE type = 'Interaction';
