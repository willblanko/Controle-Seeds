migrate(
  (app) => {
    let churches = app.findRecordsByFilter('churches', '1=1', '', 100, 0)

    function findChurchId(nameToMatch) {
      if (!nameToMatch) return null
      const target = nameToMatch.toLowerCase().trim()

      // 1. Exact match
      let match = churches.find((c) => c.getString('name').toLowerCase().trim() === target)
      if (match) return match.id

      // 2. Starts with
      match = churches.find((c) => c.getString('name').toLowerCase().trim().startsWith(target))
      if (match) return match.id

      // 3. Contains
      match = churches.find((c) => c.getString('name').toLowerCase().trim().includes(target))
      if (match) return match.id

      return null
    }

    // Sample historical data simulating the provided existing list of seeds
    const seedsToImport = [
      {
        name: 'Lucas Almeida',
        churchName: 'Barra', // Simulates "Barra da Tijuca" match
        sex: 'Masculino',
        entryMethod: 'Kids 4',
        birthDate: '15/03/2015',
        guardian1: 'Fernanda Almeida',
        phone1: '21999991111',
        hasAllergy: false,
        hasMedication: false,
        status: 'Ativo',
      },
      {
        name: 'Mariana Costa',
        churchName: 'Recreio',
        sex: 'Feminino',
        entryMethod: 'Novo Membro',
        birthDate: '10/08/2016',
        guardian1: 'Roberto Costa',
        phone1: '21988882222',
        hasAllergy: true,
        allergyDetails: 'Corante vermelho',
        hasMedication: false,
        status: 'Ativo',
      },
      {
        name: 'Gabriel Martins',
        churchName: 'Vila Velha', // Simulates "MNCS VV" match
        sex: 'Masculino',
        entryMethod: 'Convidado por Membro',
        birthDate: '22/11/2014',
        guardian1: 'Juliana Martins',
        phone1: '21977773333',
        hasAllergy: false,
        hasMedication: true,
        medicationDetails: 'Ritalina',
        status: 'Ativo',
      },
      {
        name: 'Sofia Lima',
        churchName: 'Barra',
        sex: 'Feminino',
        entryMethod: 'Kids 4',
        birthDate: '05/01/2017',
        guardian1: 'Ricardo Lima',
        phone1: '21966664444',
        hasAllergy: false,
        hasMedication: false,
        status: 'Ativo',
      },
      {
        name: 'Davi Oliveira',
        churchName: 'Centro',
        sex: 'Masculino',
        entryMethod: 'Novo Membro',
        birthDate: '30/09/2015',
        guardian1: 'Patrícia Oliveira',
        phone1: '21955555555',
        hasAllergy: true,
        allergyDetails: 'Glúten',
        hasMedication: true,
        medicationDetails: 'Antialérgico SOS',
        status: 'Ativo',
      },
    ]

    const seedsCollection = app.findCollectionByNameOrId('seeds')

    for (const data of seedsToImport) {
      let churchId = findChurchId(data.churchName)

      // Fallback: If no church matches, assign to the first available church
      // to ensure successful multi-tenant relation creation for imported seed.
      if (!churchId) {
        if (churches.length > 0) {
          churchId = churches[0].id
        } else {
          // Safe-guard if the db is completely empty of churches
          const churchCol = app.findCollectionByNameOrId('churches')
          const newChurch = new Record(churchCol)
          newChurch.set('name', 'Sede Principal')
          app.save(newChurch)
          churches = app.findRecordsByFilter('churches', '1=1', '', 100, 0)
          churchId = newChurch.id
        }
      }

      // Idempotency check: Ensure we don't duplicate existing seeds
      try {
        app.findFirstRecordByFilter('seeds', 'name = {:name} && church = {:church}', {
          name: data.name,
          church: churchId,
        })
        console.log(`[Import] Seed already exists, skipping: ${data.name}`)
        continue
      } catch (_) {
        // Record not found -> safe to insert
        const record = new Record(seedsCollection)
        record.set('church', churchId)
        record.set('name', data.name)
        record.set('sex', data.sex)
        record.set('entryMethod', data.entryMethod)
        record.set('birthDate', data.birthDate)
        record.set('guardian1', data.guardian1)
        record.set('phone1', data.phone1)
        record.set('hasAllergy', data.hasAllergy)
        if (data.allergyDetails) {
          record.set('allergyDetails', data.allergyDetails)
        }
        record.set('hasMedication', data.hasMedication)
        if (data.medicationDetails) {
          record.set('medicationDetails', data.medicationDetails)
        }
        record.set('status', data.status || 'Ativo')
        record.set('registrationDate', new Date().toISOString().split('T')[0])

        app.save(record)
        console.log(`[Import] Seed created: ${data.name}`)
      }
    }
  },
  (app) => {
    // Safe down migration: Leave empty to prevent unintended destructive data loss
    // from deleting records that could have been modified manually after import.
  },
)
