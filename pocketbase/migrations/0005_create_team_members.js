migrate(
  (app) => {
    const churches = app.findCollectionByNameOrId('churches')
    const collection = new Collection({
      name: 'team_members',
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
        { name: 'name', type: 'text', required: true },
        { name: 'photoUrl', type: 'url' },
        { name: 'email', type: 'email' },
        { name: 'dateOfBirth', type: 'text', required: true },
        { name: 'role', type: 'select', values: ['Líder', 'Membro'], required: true, maxSelect: 1 },
        { name: 'sex', type: 'select', values: ['Masculino', 'Feminino'], maxSelect: 1 },
        { name: 'courses', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_team_members_church ON team_members (church)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('team_members')
    app.delete(collection)
  },
)
