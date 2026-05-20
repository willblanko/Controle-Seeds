migrate(
  (app) => {
    const seedsCollection = app.findCollectionByNameOrId('seeds')

    const seedData = [
      {
        churchName: 'Barra da Tijuca',
        name: 'Arthur Silva',
        entryMethod: 'Kids 4',
        sex: 'Masculino',
        birthDate: '2015-03-12',
        guardian1: 'Maria Silva',
        phone1: '(21) 99999-1111',
        hasAllergy: false,
        hasMedication: false,
      },
      {
        churchName: 'Bangu',
        name: 'Helena Souza',
        entryMethod: 'Novo Membro',
        sex: 'Feminino',
        birthDate: '2017-08-21',
        guardian1: 'João Souza',
        phone1: '(21) 98888-2222',
        hasAllergy: true,
        allergyDetails: 'Poeira',
      },
      {
        churchName: 'Campo Grande | Park',
        name: 'Bernardo Santos',
        entryMethod: 'Convidado por Membro',
        sex: 'Masculino',
        birthDate: '2016-11-05',
        guardian1: 'Carlos Santos',
        phone1: '(21) 97777-3333',
        hasMedication: true,
        medicationDetails: 'Ritalina',
      },
      {
        churchName: 'Duque de Caxias',
        name: 'Laura Oliveira',
        entryMethod: 'Kids 4',
        sex: 'Feminino',
        birthDate: '2018-02-18',
        guardian1: 'Ana Oliveira',
        phone1: '(21) 96666-4444',
      },
      {
        churchName: 'Méier',
        name: 'Theo Costa',
        entryMethod: 'Novo Membro',
        sex: 'Masculino',
        birthDate: '2019-07-30',
        guardian1: 'Paulo Costa',
        phone1: '(21) 95555-5555',
      },
      {
        churchName: 'Santa Cruz',
        name: 'Isabella Almeida',
        entryMethod: 'Convidado por Membro',
        sex: 'Feminino',
        birthDate: '2015-12-10',
        guardian1: 'Fernanda Almeida',
        phone1: '(21) 94444-4444',
      },
      {
        churchName: 'São João de Meriti',
        name: 'Miguel Barros',
        entryMethod: 'Kids 4',
        sex: 'Masculino',
        birthDate: '2017-05-25',
        guardian1: 'Roberto Barros',
        phone1: '(21) 93333-3333',
      },
      {
        churchName: 'Taquara',
        name: 'Sophia Ribeiro',
        entryMethod: 'Novo Membro',
        sex: 'Feminino',
        birthDate: '2018-09-14',
        guardian1: 'Luciana Ribeiro',
        phone1: '(21) 92222-2222',
      },
      {
        churchName: 'Vargem Pequena',
        name: 'Davi Martins',
        entryMethod: 'Convidado por Membro',
        sex: 'Masculino',
        birthDate: '2016-04-03',
        guardian1: 'Ricardo Martins',
        phone1: '(21) 91111-1111',
      },
      {
        churchName: 'Vila Valqueire',
        name: 'Alice Lima',
        entryMethod: 'Kids 4',
        sex: 'Feminino',
        birthDate: '2019-01-19',
        guardian1: 'Camila Lima',
        phone1: '(21) 90000-0000',
      },
    ]

    for (const item of seedData) {
      let churchId
      try {
        const church = app.findFirstRecordByData('churches', 'name', item.churchName)
        churchId = church.id
      } catch (e) {
        console.log('Church not found: ' + item.churchName)
        continue
      }

      try {
        app.findFirstRecordByFilter('seeds', `name='${item.name}' && church='${churchId}'`)
        continue // skip if exists to ensure idempotency
      } catch (_) {
        // not found, proceed to create
      }

      const record = new Record(seedsCollection)
      record.set('church', churchId)
      record.set('name', item.name)
      record.set('entryMethod', item.entryMethod)
      record.set('sex', item.sex)
      record.set('birthDate', item.birthDate)
      record.set('guardian1', item.guardian1)
      record.set('phone1', item.phone1)

      // Default values
      record.set('hasAllergy', item.hasAllergy || false)
      if (item.allergyDetails) {
        record.set('allergyDetails', item.allergyDetails)
      }

      record.set('hasMedication', item.hasMedication || false)
      if (item.medicationDetails) {
        record.set('medicationDetails', item.medicationDetails)
      }

      const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + 'Z'
      record.set('registrationDate', now)

      app.save(record)
    }
  },
  (app) => {
    const seedNames = [
      'Arthur Silva',
      'Helena Souza',
      'Bernardo Santos',
      'Laura Oliveira',
      'Theo Costa',
      'Isabella Almeida',
      'Miguel Barros',
      'Sophia Ribeiro',
      'Davi Martins',
      'Alice Lima',
    ]

    for (const name of seedNames) {
      try {
        const records = app.findRecordsByFilter('seeds', `name='${name}'`, '', 100, 0)
        for (const rec of records) {
          app.delete(rec)
        }
      } catch (e) {
        // ignore
      }
    }
  },
)
