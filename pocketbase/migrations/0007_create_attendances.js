migrate(
  (app) => {
    const events = app.findCollectionByNameOrId('events')
    const seeds = app.findCollectionByNameOrId('seeds')
    const team_members = app.findCollectionByNameOrId('team_members')

    const collection = new Collection({
      name: 'attendances',
      type: 'base',
      listRule:
        "@request.auth.role = 'admin' || event.church.church_users_via_church.user ?= @request.auth.id",
      viewRule:
        "@request.auth.role = 'admin' || event.church.church_users_via_church.user ?= @request.auth.id",
      createRule:
        "@request.auth.role = 'admin' || event.church.church_users_via_church.user ?= @request.auth.id",
      updateRule:
        "@request.auth.role = 'admin' || event.church.church_users_via_church.user ?= @request.auth.id",
      deleteRule:
        "@request.auth.role = 'admin' || event.church.church_users_via_church.user ?= @request.auth.id",
      fields: [
        {
          name: 'event',
          type: 'relation',
          collectionId: events.id,
          required: true,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'seed',
          type: 'relation',
          collectionId: seeds.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'team_member',
          type: 'relation',
          collectionId: team_members.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'type', type: 'select', values: ['seed', 'team'], required: true, maxSelect: 1 },
        { name: 'present', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_attendances_event ON attendances (event)',
        "CREATE UNIQUE INDEX idx_attendances_unique_seed ON attendances (event, seed) WHERE seed != ''",
        "CREATE UNIQUE INDEX idx_attendances_unique_team ON attendances (event, team_member) WHERE team_member != ''",
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('attendances')
    app.delete(collection)
  },
)
