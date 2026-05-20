migrate(
  (app) => {
    const churches = app.findCollectionByNameOrId('churches')
    const collection = new Collection({
      name: 'church_users',
      type: 'base',
      listRule: "@request.auth.role = 'admin' || user = @request.auth.id",
      viewRule: "@request.auth.role = 'admin' || user = @request.auth.id",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'user',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          required: true,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'church',
          type: 'relation',
          collectionId: churches.id,
          required: true,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_church_users_unique ON church_users (user, church)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('church_users')
    app.delete(collection)
  },
)
