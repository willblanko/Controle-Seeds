migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('seeds')

    ;['entryMethod', 'sex', 'birthDate', 'guardian1', 'phone1'].forEach((fieldName) => {
      const field = col.fields.getByName(fieldName)
      if (field) {
        field.required = false
      }
    })

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('seeds')

    ;['entryMethod', 'sex', 'birthDate', 'guardian1', 'phone1'].forEach((fieldName) => {
      const field = col.fields.getByName(fieldName)
      if (field) {
        field.required = true
      }
    })

    app.save(col)
  },
)
