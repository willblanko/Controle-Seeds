migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('team_members')
    col.fields.removeByName('email')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('team_members')
    col.fields.add(
      new EmailField({
        name: 'email',
        required: false,
      }),
    )
    app.save(col)
  },
)
