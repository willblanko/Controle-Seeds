migrate(
  (app) => {
    const events = app.findCollectionByNameOrId('events')

    if (!events.fields.getByName('endDate')) {
      events.fields.add(
        new TextField({
          name: 'endDate',
          required: false,
        }),
      )
      app.save(events)
    }

    const attendances = app.findCollectionByNameOrId('attendances')
    attendances.addIndex('idx_attendances_seed_event', false, 'seed, event', '')
    app.save(attendances)
  },
  (app) => {
    const events = app.findCollectionByNameOrId('events')
    if (events.fields.getByName('endDate')) {
      events.fields.removeByName('endDate')
      app.save(events)
    }

    const attendances = app.findCollectionByNameOrId('attendances')
    attendances.removeIndex('idx_attendances_seed_event')
    app.save(attendances)
  },
)
