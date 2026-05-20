migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    let admin
    try {
      admin = app.findAuthRecordByEmail('_pb_users_auth_', 'ilopes@lclaw.com.br')
      admin.set('role', 'admin')
      app.save(admin)
    } catch (_) {
      admin = new Record(users)
      admin.setEmail('ilopes@lclaw.com.br')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Admin')
      admin.set('role', 'admin')
      app.save(admin)
    }

    const churches = app.findCollectionByNameOrId('churches')
    const church1 = new Record(churches)
    church1.set('name', 'Igreja Sede')
    app.save(church1)

    const church_users = app.findCollectionByNameOrId('church_users')
    const cu = new Record(church_users)
    cu.set('user', admin.id)
    cu.set('church', church1.id)
    app.save(cu)
  },
  (app) => {},
)
