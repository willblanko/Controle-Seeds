migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('events')

    if (!col.fields.getByName('completed')) {
      col.fields.add(new BoolField({ name: 'completed' }))
    }

    if (!col.fields.getByName('media')) {
      col.fields.add(
        new FileField({
          name: 'media',
          maxSelect: 10,
          maxSize: 52428800,
          mimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'video/mp4',
            'video/quicktime',
          ],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('events')
    col.fields.removeByName('completed')
    col.fields.removeByName('media')
    app.save(col)
  },
)
