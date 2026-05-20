migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('events')

    const churchField = col.fields.getByName('church')
    if (churchField) {
      churchField.required = false
    }

    const globalRules = "church = '' || category = 'Camp' || category = 'Connection'"
    const prevListRule =
      "@request.auth.role = 'admin' || church.church_users_via_church.user ?= @request.auth.id || church.event_host.church_users_via_church.user ?= @request.auth.id"

    const newRule = `${globalRules} || ${prevListRule}`

    col.listRule = newRule
    col.viewRule = newRule

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('events')

    const churchField = col.fields.getByName('church')
    if (churchField) {
      churchField.required = true
    }

    const prevListRule =
      "@request.auth.role = 'admin' || church.church_users_via_church.user ?= @request.auth.id || church.event_host.church_users_via_church.user ?= @request.auth.id"
    col.listRule = prevListRule
    col.viewRule = prevListRule

    app.save(col)
  },
)
