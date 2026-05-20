migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.manageRule = "@request.auth.role = 'admin'"
    app.save(col)

    app.db().newQuery('UPDATE users SET emailVisibility = 1').execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.manageRule = null
    app.save(col)

    app.db().newQuery('UPDATE users SET emailVisibility = 0').execute()
  },
)
