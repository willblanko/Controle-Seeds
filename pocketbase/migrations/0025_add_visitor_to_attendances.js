migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('attendances')
    col.fields.add(new TextField({ name: 'visitor_name' }))

    const typeField = col.fields.getByName('type')
    if (typeField && !typeField.values.includes('visitor')) {
      typeField.values.push('visitor')
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('attendances')
    try {
      col.fields.removeByName('visitor_name')
    } catch (_) {}

    const typeField = col.fields.getByName('type')
    if (typeField) {
      typeField.values = typeField.values.filter((v) => v !== 'visitor')
    }

    app.save(col)
  },
)
