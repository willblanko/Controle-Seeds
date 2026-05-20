migrate(
  (app) => {
    const churches = app.findCollectionByNameOrId('churches')
    if (!churches.fields.getByName('address')) {
      churches.fields.add(new TextField({ name: 'address' }))
    }
    if (!churches.fields.getByName('event_host')) {
      churches.fields.add(
        new RelationField({ name: 'event_host', collectionId: churches.id, maxSelect: 1 }),
      )
    }

    const churchesRule =
      "@request.auth.role = 'admin' || church_users_via_church.user ?= @request.auth.id || event_host.church_users_via_church.user ?= @request.auth.id || churches_via_event_host.church_users_via_church.user ?= @request.auth.id"
    churches.listRule = churchesRule
    churches.viewRule = churchesRule
    app.save(churches)

    const dependentCollections = ['seeds', 'team_members', 'events']
    for (const name of dependentCollections) {
      const col = app.findCollectionByNameOrId(name)
      const rule =
        "@request.auth.role = 'admin' || church.church_users_via_church.user ?= @request.auth.id || church.event_host.church_users_via_church.user ?= @request.auth.id"
      col.listRule = rule
      col.viewRule = rule
      col.createRule = rule
      col.updateRule = rule
      col.deleteRule = rule
      app.save(col)
    }

    const attendances = app.findCollectionByNameOrId('attendances')
    const attRule =
      "@request.auth.role = 'admin' || event.church.church_users_via_church.user ?= @request.auth.id || event.church.event_host.church_users_via_church.user ?= @request.auth.id"
    attendances.listRule = attRule
    attendances.viewRule = attRule
    attendances.createRule = attRule
    attendances.updateRule = attRule
    attendances.deleteRule = attRule
    app.save(attendances)
  },
  (app) => {
    const churches = app.findCollectionByNameOrId('churches')
    churches.fields.removeByName('address')
    churches.fields.removeByName('event_host')

    const oldChurchesRule =
      "@request.auth.role = 'admin' || church_users_via_church.user ?= @request.auth.id"
    churches.listRule = oldChurchesRule
    churches.viewRule = oldChurchesRule
    app.save(churches)

    const dependentCollections = ['seeds', 'team_members', 'events']
    for (const name of dependentCollections) {
      const col = app.findCollectionByNameOrId(name)
      const oldRule =
        "@request.auth.role = 'admin' || church.church_users_via_church.user ?= @request.auth.id"
      col.listRule = oldRule
      col.viewRule = oldRule
      col.createRule = oldRule
      col.updateRule = oldRule
      col.deleteRule = oldRule
      app.save(col)
    }

    const attendances = app.findCollectionByNameOrId('attendances')
    const oldAttRule =
      "@request.auth.role = 'admin' || event.church.church_users_via_church.user ?= @request.auth.id"
    attendances.listRule = oldAttRule
    attendances.viewRule = oldAttRule
    attendances.createRule = oldAttRule
    attendances.updateRule = oldAttRule
    attendances.deleteRule = oldAttRule
    app.save(attendances)
  },
)
