migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('team_members')
    try {
      col.fields.removeByName('photoUrl')
    } catch (_) {}
    col.fields.add(
      new FileField({
        name: 'photo',
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp'],
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('team_members')
    try {
      col.fields.removeByName('photo')
    } catch (_) {}
    col.fields.add(new URLField({ name: 'photoUrl' }))
    app.save(col)
  },
)
