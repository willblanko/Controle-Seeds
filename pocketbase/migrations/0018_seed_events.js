migrate(
  (app) => {
    const eventsCol = app.findCollectionByNameOrId('events')

    // Create "Seeds Camp Reino" (Global Event)
    try {
      app.findFirstRecordByData('events', 'title', 'Seeds Camp Reino')
    } catch (_) {
      const camp = new Record(eventsCol)
      camp.set('title', 'Seeds Camp Reino')
      camp.set('category', 'Camp')
      camp.set('date', '2026-07-17')
      camp.set('time', '18:00')
      camp.set('description', 'Acampamento Global Seeds Camp Reino')
      app.save(camp)
    }

    // Create biweekly sequence for all churches starting June 30, 2026
    const churches = app.findRecordsByFilter('churches', '1=1', '', 1000, 0)
    const dates = [
      { d: '2026-06-30', cat: 'Culto', title: 'Culto Seeds' },
      { d: '2026-07-14', cat: 'Hangout', title: 'Seeds Hangout' },
      { d: '2026-07-28', cat: 'Culto', title: 'Culto Seeds' },
      { d: '2026-08-11', cat: 'Hangout', title: 'Seeds Hangout' },
    ]

    for (const c of churches) {
      for (const evtDef of dates) {
        try {
          app.findFirstRecordByFilter(
            'events',
            `church='${c.id}' && date='${evtDef.d}' && category='${evtDef.cat}'`,
          )
        } catch (_) {
          const evt = new Record(eventsCol)
          evt.set('church', c.id)
          evt.set('title', evtDef.title)
          evt.set('category', evtDef.cat)
          evt.set('date', evtDef.d)
          evt.set('time', '19:00')
          app.save(evt)
        }
      }
    }
  },
  (app) => {
    // Try to remove generated events to rollback
    try {
      const camp = app.findFirstRecordByData('events', 'title', 'Seeds Camp Reino')
      app.delete(camp)
    } catch (_) {}
  },
)
