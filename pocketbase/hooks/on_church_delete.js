onRecordDelete((e) => {
  const churchId = e.record.id

  $app
    .db()
    .newQuery('DELETE FROM church_users WHERE church = {:id}')
    .bind({ id: churchId })
    .execute()
  $app.db().newQuery('DELETE FROM seeds WHERE church = {:id}').bind({ id: churchId }).execute()
  $app
    .db()
    .newQuery('DELETE FROM team_members WHERE church = {:id}')
    .bind({ id: churchId })
    .execute()
  $app
    .db()
    .newQuery('DELETE FROM attendances WHERE event IN (SELECT id FROM events WHERE church = {:id})')
    .bind({ id: churchId })
    .execute()
  $app.db().newQuery('DELETE FROM events WHERE church = {:id}').bind({ id: churchId }).execute()

  e.next()
}, 'churches')
