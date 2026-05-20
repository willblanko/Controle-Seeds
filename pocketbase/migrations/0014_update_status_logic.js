migrate(
  (app) => {
    // Add status to users
    const usersCol = app.findCollectionByNameOrId('users')
    if (!usersCol.fields.getByName('status')) {
      usersCol.fields.add(
        new SelectField({
          name: 'status',
          values: ['Ativo', 'Inativo'],
          maxSelect: 1,
        }),
      )
      app.save(usersCol)
    }

    // Update existing users to 'Ativo'
    app
      .db()
      .newQuery("UPDATE users SET status = 'Ativo' WHERE status IS NULL OR status = ''")
      .execute()

    // Remove status from seeds
    const seedsCol = app.findCollectionByNameOrId('seeds')
    if (seedsCol.fields.getByName('status')) {
      seedsCol.fields.removeByName('status')
      app.save(seedsCol)
    }
  },
  (app) => {
    // Revert: Add status back to seeds, remove from users
    const seedsCol = app.findCollectionByNameOrId('seeds')
    if (!seedsCol.fields.getByName('status')) {
      seedsCol.fields.add(
        new SelectField({
          name: 'status',
          values: ['Ativo', 'Inativo'],
          maxSelect: 1,
        }),
      )
      app.save(seedsCol)
    }

    const usersCol = app.findCollectionByNameOrId('users')
    if (usersCol.fields.getByName('status')) {
      usersCol.fields.removeByName('status')
      app.save(usersCol)
    }
  },
)
