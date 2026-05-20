migrate(
  (app) => {
    const collection = new Collection({
      name: 'churches',
      type: 'base',
      listRule: "@request.auth.role = 'admin' || church_users_via_church.user ?= @request.auth.id",
      viewRule: "@request.auth.role = 'admin' || church_users_via_church.user ?= @request.auth.id",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('churches')
    app.delete(collection)
  },
)
