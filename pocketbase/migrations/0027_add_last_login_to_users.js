migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    if (!col.fields.getByName('last_login')) {
      col.fields.add(new TextField({ name: 'last_login' }))
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    if (col.fields.getByName('last_login')) {
      col.fields.removeByName('last_login')
      app.save(col)
    }
  },
)
