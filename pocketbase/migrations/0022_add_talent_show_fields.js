migrate(
  (app) => {
    const attendances = app.findCollectionByNameOrId('attendances')

    if (!attendances.fields.getByName('is_participant')) {
      attendances.fields.add(
        new BoolField({
          name: 'is_participant',
        }),
      )
    }

    if (!attendances.fields.getByName('talent_details')) {
      attendances.fields.add(
        new TextField({
          name: 'talent_details',
        }),
      )
    }

    app.save(attendances)
  },
  (app) => {
    const attendances = app.findCollectionByNameOrId('attendances')
    attendances.fields.removeByName('is_participant')
    attendances.fields.removeByName('talent_details')
    app.save(attendances)
  },
)
