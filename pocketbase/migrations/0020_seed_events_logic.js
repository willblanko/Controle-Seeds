migrate(
  (app) => {
    const eventsCol = app.findCollectionByNameOrId('events')

    // Create Seeds Camp Reino event
    try {
      app.findFirstRecordByData('events', 'title', 'Seeds Camp Reino - 17/07/2026')
    } catch (_) {
      const camp = new Record(eventsCol)
      camp.set('title', 'Seeds Camp Reino - 17/07/2026')
      camp.set('category', 'Camp')
      camp.set('date', '2026-07-17')
      camp.set('time', '18:00')
      camp.set('description', 'Acampamento global Seeds Camp Reino')
      app.save(camp)
    }

    // Find all churches
    let allChurches = []
    try {
      allChurches = app.findRecordsByFilter('churches', '1=1', '', 1000, 0)
    } catch (_) {
      // no churches
    }

    // Bi-weekly schedule on Saturdays starting from near 30/06/2026
    const schedule = [
      { date: '2026-07-04', cat: 'Culto', label: '04/07/2026' },
      { date: '2026-07-18', cat: 'Hangout', label: '18/07/2026' },
      { date: '2026-08-01', cat: 'Culto', label: '01/08/2026' },
      { date: '2026-08-15', cat: 'Hangout', label: '15/08/2026' },
      { date: '2026-08-29', cat: 'Culto', label: '29/08/2026' },
      { date: '2026-09-12', cat: 'Hangout', label: '12/09/2026' },
    ]

    for (const church of allChurches) {
      for (const item of schedule) {
        const title = `${item.cat} - ${item.label}`
        const existing = app.findRecordsByFilter(
          'events',
          `title = '${title}' && church = '${church.id}'`,
          '',
          1,
          0,
        )
        if (existing.length === 0) {
          const ev = new Record(eventsCol)
          ev.set('church', church.id)
          ev.set('title', title)
          ev.set('category', item.cat)
          ev.set('date', item.date)
          ev.set('time', '19:00')
          app.save(ev)
        }
      }
    }
  },
  (app) => {
    try {
      const camp = app.findFirstRecordByData('events', 'title', 'Seeds Camp Reino - 17/07/2026')
      app.delete(camp)
    } catch (_) {}
  },
)
