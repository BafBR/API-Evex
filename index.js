// 19164 Bruno Arnone Franchi
// 19167 Eduardo de Almeida Migueis
// 19191 Nicolas Denadai Schmidt

const express = require('express')
const sql = require('mssql')
const cors = require('cors')

const config = require('./config.json')

const app = express()
const port = 3000

const pool = new sql.ConnectionPool(config.sqlConfig)
const poolConnect = pool.connect()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())

const router = express.Router()

const CACHE = {
	eventos: null,
	funcionarios: null,
	departamentos: null,
	participacoes: null,
	tipos: null,
	subtipos: null,
	locais: null,
}

router.get('/', (_req, res) => res.sendStatus(200))
app.use('/', router)

// GET todos os funcionarios,
// GET um funcionario por id
router.get('/funcionarios', async (req, res) => {
	if (!CACHE.funcionarios) await atualizarFuncionarios()

	const id = req.query.id
	if (!id) res.json(CACHE.funcionarios)

	for (const funcionario of CACHE.funcionarios)
		if (funcionario.id == id) return res.json(funcionario)
})

// POST cadastrar novo funcionario
router.post('/funcionarios', async (req, res) => {
	const nome = req.body.nome
	const apelido = req.body.apelido
	const departamento = req.body.departamento
	if (!nome || !apelido || !departamento) return res.sendStatus(400)

	executeSql(
		'insert into evex.Funcionario values(@nome, @apelido, @departamento)',
		{
			fields: [
				['nome', sql.VarChar(255), nome],
				['apelido', sql.VarChar(255), apelido],
				['departamento', sql.VarChar(255), departamento],
			],
		},
		(result) => {
			if (result.error) result.status = 400
			else result.status = 200
			atualizarFuncionarios()
			return res.sendStatus(result.status)
		}
	)
})

// PUT editar dados de um funcionario
router.put('/funcionario', async (req, res) => {
	const id = req.body.id
	const nome = req.body.nome
	const apelido = req.body.apelido
	const departamento = req.body.departamento
	if (!id || !nome || !apelido || !departamento) return res.sendStatus(400)

	executeSql(
		'update evex.Funcionario set nome = @nome, apelido = @apelido, departamento = @departamento where id = @id',
		{
			fields: [
				['id', sql.Int, id],
				['nome', sql.VarChar(255), nome],
				['apelido', sql.VarChar(255), apelido],
				['departamento', sql.Int, departamento],
			],
		},
		(result) => {
			if (result.error) result.status = 400
			else result.status = 200
			atualizarFuncionarios()
			return res.sendStatus(result.status)
		}
	)
})

// DELETE um funcionario
router.delete('/funcionario', async (req, res) => {
	const id = req.body.id
	if (!id) return res.sendStatus(400)

	executeSql(
		'delete from evex.Funcionario where id = @id',
		{ fields: [['id', sql.Int, id]] },
		(result) => {
			if (result.error) result.status = 400
			else result.status = 200
			atualizarFuncionarios()
			return res.sendStatus(result.status)
		}
	)
})

// GET todos os departamentos,
// GET um departamento por id
router.get('/departamentos', async (req, res) => {
	if (!CACHE.departamentos) await atualizarDepartamentos()

	const id = req.query.id
	if (!id) res.json(CACHE.departamentos)

	for (const departamento of CACHE.departamentos)
		if (departamento.id == id) return res.json(departamento)
})

// POST novo departamento
router.post('/departamentos', async (req, res) => {
	const nome = req.body.nome
	if (!nome) return res.sendStatus(400)

	executeSql(
		'insert into evex.Departamento values(@nome)',
		{ fields: [['nome', sql.VarChar(255), nome]] },
		(result) => {
			if (!result || result.success) result.status = 200
			else result.status = 400
			atualizarDepartamentos()
			return res.sendStatus(result.status)
		}
	)
})

// GET todos os eventos,
// GET um evento por id
router.get('/eventos', async (req, res) => {
	if (!CACHE.eventos) await atualizarEventos()

	const id = req.query.id
	if (!id) res.json(CACHE.eventos)

	for (const evento of CACHE.eventos)
		if (evento.id == id) return res.json(evento)
})

// GET todos os eventos para os quais um funcionario está convidado
router.get('/eventos/participo', async (req, res) => {
	if (!CACHE.eventos) await atualizarEventos()
	if (!CACHE.participacoes) await atualizarParticipacoes()

	const funcionarioId = req.query.funcionario
	if (!funcionarioId) res.sendStatus(400)

	let eventos = []
	for (const participacao of CACHE.participacoes)
		if (participacao.funcionario.id == funcionarioId)
			for (const evento of CACHE.eventos)
				if (evento.id == participacao.evento) eventos.push(evento)

	return res.json(eventos)
})

// GET todos os eventos que um usuario gerencia
router.get('/eventos/gerencio', async (req, res) => {
	if (!CACHE.eventos) await atualizarEventos()

	const funcionarioId = req.query.funcionario
	if (!funcionarioId) res.sendStatus(400)

	let eventos = []
	for (const evento of CACHE.eventos)
		if (evento.responsavel.id == funcionarioId) eventos.push(evento)

	return res.json(eventos)
})

// GET todos os participantes de um evento
router.get('/participantes', async (req, res) => {
	if (!CACHE.participacoes) await atualizarParticipacoes()

	const evento = req.query.evento
	if (!evento) return res.sendStatus(400)

	let participantes = []
	for (const participacao of CACHE.participacoes)
		if (participacao.evento == evento)
			participantes.push(participacao.funcionario)

	return res.json(participantes)
})

// POST cria uma nova participação
router.post('/participantes', async (req, res) => {
	const evento = req.body.evento
	const funcionario = req.body.funcionario
	if (!evento || !funcionario) return res.sendStatus(400)

	executeSql(
		'insert into evex.Participantes values(@evento, @funcionario)',
		{
			fields: [
				['evento', sql.Int, evento],
				['funcionario', sql.Int, funcionario],
			],
		},
		(result) => {
			if (!result.status)
				if (result.error) result.status = 400
				else result.status = 200
			atualizarParticipacoes()
			return res.sendStatus(result.status)
		}
	)
})

// POST cria um novo evento
router.post('/eventos', async (req, res) => {
	const titulo = req.body.titulo
	const descricao = req.body.descricao
	const responsavel = req.body.responsavel
	const tipo = req.body.tipo
	const subtipo = req.body.subtipo
	let datahora = req.body.datahora
	const localizacao = req.body.localizacao
	if (!titulo || !responsavel || !tipo || !datahora || !localizacao)
		return res.sendStatus(400)

	datahora = new Date(datahora)

	executeSql(
		'insert into evex.Evento output INSERTED.id values(@titulo, @descricao, @responsavel, @tipo, @subtipo, @datahora, @localizacao)',
		{
			fields: [
				['titulo', sql.VarChar(255), titulo],
				['descricao', sql.Text, descricao],
				['responsavel', sql.Int, responsavel],
				['tipo', sql.VarChar(255), tipo],
				['subtipo', sql.VarChar(255), subtipo],
				['datahora', sql.DateTime, datahora],
				['localizacao', sql.Int, localizacao],
			],
		},
		(result) => {
			if (result.error) result.status = 400
			else result.status = 200
			atualizarEventos()

			// criar participação
			executeSql(
				'insert into evex.Participantes values(@@identity, @funcionario)',
				{
					fields: [['funcionario', sql.Int, responsavel]],
				},
				(result) => {
					if (!result.status)
						if (result.error) result.status = 400
						else result.status = 200
					atualizarParticipacoes()
					return res
						.status(result.status)
						.json({ id: result.results[0].id })
				}
			)
		}
	)
})

// PUT edita um evento
router.put('/eventos', async (req, res) => {
	const titulo = req.body.titulo
	const descricao = req.body.descricao
	const responsavel = req.body.responsavel
	const tipo = req.body.tipo
	const subtipo = req.body.subtipo
	let datahora = req.body.datahora
	const localizacao = req.body.localizacao
	if (!titulo || !responsavel || !tipo || !datahora || !localizacao)
		return res.sendStatus(400)

	datahora = new Date(datahora)

	executeSql(
		'update evex.Evento set titulo = @titulo, descricao = @descricao, responsavel = @responsavel, tipo = @tipo, subtipo = @subtipo, datahora = @datahora, localizacao = @localizacao where id = @id',
		{
			fields: [
				['id', sql.Int, id],
				['titulo', sql.VarChar(255), titulo],
				['descricao', sql.Text, descricao],
				['responsavel', sql.Int, responsavel],
				['tipo', sql.VarChar(255), tipo],
				['subtipo', sql.VarChar(255), subtipo],
				['datahora', sql.DateTime, datahora],
				['localizacao', sql.Int, localizacao],
			],
		},
		(result) => {
			if (result.error) result.status = 400
			else result.status = 200
			atualizarEventos()
			return res.sendStatus(result.status)
		}
	)
})

// GET todos os tipos,
// GET um tipo por id
router.get('/tipos', async (req, res) => {
	if (!CACHE.tipos) await atualizarTipos()

	const id = req.query.id
	if (!id) return res.json(CACHE.tipos)

	for (const tipo of CACHE.tipos) if (tipo.id == id) return res.json(tipo)
})

// GET todos os subtipos,
// GET um subtipo por id
router.get('/subtipos', async (req, res) => {
	if (!CACHE.subtipos) await atualizarSubtipos()

	const id = req.query.id
	if (!id) return res.json(CACHE.subtipos)

	for (const subtipo of CACHE.subtipos)
		if (subtipo.id == id) return res.json(subtipo)
})

// GET todos os locais,
// GET um local por id
router.get('/locais', async (req, res) => {
	if (!CACHE.locais) await atualizarLocais()

	const id = req.query.id
	if (!id) return res.json(CACHE.locais)

	for (const local of CACHE.locais) if (local.id == id) return res.json(local)
})

app.listen(port, () =>
	console.log(`[app] listening at http://localhost:${port}/`)
)

function atualizarEventos() {
	return new Promise((resolve) =>
		executeSql(`select * from evex.Evento`, null, async (result) => {
			CACHE.eventos = result.results

			if (!CACHE.funcionarios) await atualizarFuncionarios()
			if (!CACHE.tipos) await atualizarTipos()
			if (!CACHE.subtipos) await atualizarSubtipos()
			if (!CACHE.participacoes) await atualizarParticipacoes()
			if (!CACHE.locais) await atualizarLocais()

			CACHE.eventos.forEach((evento) => {
				let userId = evento.responsavel
				for (let i = 0; i < CACHE.funcionarios.length; i++)
					if (CACHE.funcionarios[i].id == userId)
						evento.responsavel = CACHE.funcionarios[i]

				let tipoId = evento.tipo
				for (let i = 0; i < CACHE.tipos.length; i++)
					if (CACHE.tipos[i].id == tipoId)
						evento.tipo = CACHE.tipos[i]

				let subtipoId = evento.subtipo
				if (subtipoId)
					for (let i = 0; i < CACHE.subtipos.length; i++)
						if (CACHE.subtipos[i].id == subtipoId)
							evento.subtipo = CACHE.subtipos[i]

				let localId = evento.localizacao
				for (let i = 0; i < CACHE.locais.length; i++)
					if (CACHE.locais[i].id == localId)
						evento.localizacao = CACHE.locais[i]
			})
			resolve()
		})
	)
}

function atualizarFuncionarios() {
	return new Promise((resolve) =>
		executeSql(`select * from evex.Funcionario`, null, async (result) => {
			CACHE.funcionarios = result.results

			if (!CACHE.departamentos) await atualizarDepartamentos()

			CACHE.funcionarios.forEach((funcionario) => {
				let departamentoId = funcionario.departamento
				for (let i = 0; i < CACHE.departamentos.length; i++)
					if (CACHE.departamentos[i].id == departamentoId)
						funcionario.departamento = CACHE.departamentos[i]
			})

			resolve()
		})
	)
}

function atualizarDepartamentos() {
	return new Promise((resolve) =>
		executeSql(`select * from evex.Departamento`, null, (result) => {
			CACHE.departamentos = result.results
			resolve()
		})
	)
}

function atualizarParticipacoes() {
	return new Promise((resolve) =>
		executeSql(`select * from evex.Participantes`, null, async (result) => {
			CACHE.participacoes = result.results

			if (!CACHE.funcionarios) await atualizarFuncionarios()

			CACHE.participacoes.forEach((participacao) => {
				let funcionarioId = participacao.funcionario
				for (let i = 0; i < CACHE.funcionarios.length; i++)
					if (CACHE.funcionarios[i].id == funcionarioId)
						participacao.funcionario = CACHE.funcionarios[i]
			})

			resolve()
		})
	)
}

function atualizarTipos() {
	return new Promise((resolve) =>
		executeSql(`select * from evex.TipoEvento`, null, (result) => {
			CACHE.tipos = result.results
			resolve()
		})
	)
}

function atualizarSubtipos() {
	return new Promise((resolve) =>
		executeSql(`select * from evex.SubTipoEvento`, null, (result) => {
			CACHE.subtipos = result.results
			resolve()
		})
	)
}

function atualizarLocais() {
	return new Promise((resolve) =>
		executeSql(`select * from evex.Localizacao`, null, (result) => {
			CACHE.locais = result.results
			resolve()
		})
	)
}

async function executeSql(query, fields, callback) {
	await poolConnect
	console.log(`[sql] ${query};`)
	try {
		const request = pool.request()
		if (fields)
			fields.fields.forEach((field) => {
				request.input(field[0], field[1], field[2])
			})
		const result = await request.query(query)
		callback({ success: true, results: result.recordset })
	} catch (err) {
		console.error(`[err] ${err}`)
		callback({
			success: false,
		})
	}
}
