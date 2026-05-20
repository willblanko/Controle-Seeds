migrate(
  (app) => {
    const churches = app.findCollectionByNameOrId('churches')
    const collection = new Collection({
      name: 'events',
      type: 'base',
      listRule:
        "@request.auth.role = 'admin' || church.church_users_via_church.user ?= @request.auth.id",
      viewRule:
        "@request.auth.role = 'admin' || church.church_users_via_church.user ?= @request.auth.id",
      createRule:
        "@request.auth.role = 'admin' || church.church_users_via_church.user ?= @request.auth.id",
      updateRule:
        "@request.auth.role = 'admin' || church.church_users_via_church.user ?= @request.auth.id",
      deleteRule:
        "@request.auth.role = 'admin' || church.church_users_via_church.user ?= @request.auth.id",
      fields: [
        {
          name: 'church',
          type: 'relation',
          collectionId: churches.id,
          required: true,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'date', type: 'text', required: true },
        { name: 'time', type: 'text', required: true },
        { name: 'location', type: 'text' },
        { name: 'category', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_events_church ON events (church)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('events')
    app.delete(collection)
  },
)
