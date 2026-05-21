migrate(
  (app) => {
    const teamCol = app.findCollectionByNameOrId('team_members')
    teamCol.fields.add(new TextField({ name: 'phone', required: false }))
    teamCol.fields.add(new TextField({ name: 'entry_date', required: false }))
    app.save(teamCol)
  },
  (app) => {
    const teamCol = app.findCollectionByNameOrId('team_members')
    teamCol.fields.removeByName('phone')
    teamCol.fields.removeByName('entry_date')
    app.save(teamCol)
  },
)
