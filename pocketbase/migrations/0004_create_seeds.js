migrate(
  (app) => {
    const churches = app.findCollectionByNameOrId('churches')
    const collection = new Collection({
      name: 'seeds',
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
        { name: 'photo', type: 'url' },
        {
          name: 'entryMethod',
          type: 'select',
          values: ['Kids 4', 'Novo Membro', 'Convidado por Membro'],
          required: true,
          maxSelect: 1,
        },
        {
          name: 'sex',
          type: 'select',
          values: ['Masculino', 'Feminino', 'Outro'],
          required: true,
          maxSelect: 1,
        },
        { name: 'birthDate', type: 'text', required: true },
        { name: 'guardian1', type: 'text', required: true },
        { name: 'guardian2', type: 'text' },
        { name: 'phone1', type: 'text', required: true },
        { name: 'phone2', type: 'text' },
        { name: 'hasAllergy', type: 'bool' },
        { name: 'allergyDetails', type: 'text' },
        { name: 'hasMedication', type: 'bool' },
        { name: 'medicationDetails', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'status', type: 'select', values: ['Ativo', 'Inativo'], maxSelect: 1 },
        { name: 'registrationDate', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_seeds_church ON seeds (church)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('seeds')
    app.delete(collection)
  },
)
