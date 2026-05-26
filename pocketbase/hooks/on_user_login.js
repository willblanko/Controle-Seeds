onRecordAuthRequest((e) => {
  if (e.record) {
    e.record.set('last_login', new Date().toISOString())
    $app.saveNoValidate(e.record)
  }
  e.next()
}, 'users')
