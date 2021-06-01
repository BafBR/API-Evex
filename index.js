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

router.get('/', (_req, res) => res.sendStatus(200))
app.use('/', router)

// GET todos os funcionarios
router.get('/funcionarios', async (req, res) => {
	executeSql(`select * from evex.Funcionario`, null, (result) =>
		res.json(result)
	)
})

// GET um funcionario
// funcionario -> id do funcionario
router.get('/funcionario', async (req, res) => {
	const funcionario = req.query.funcionario
	if (!funcionario) return res.sendStatus(400)

	executeSql(
		`select * from evex.Funcionario where funcionario = @funcionario`,
		{
			fields: [['funcionario', sql.VarChar(255), funcionario]],
		},
		(result) => res.json(result)
	)
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
			return res.sendStatus(result.status)
		}
	)
})

// GET todos os departamentos
router.get('/departamentos', async (req, res) => {
	executeSql(`select * from evex.Departamento`, null, (result) =>
		res.json(result)
	)
})

// POST novo departamento
router.post('/departamentos', async (req, res) => {
	const nome = req.body.nome
	if (!nome) return res.sendStatus(400)

	executeSql(
		'insert into evex.Departamento values(@nome)',
		{
			fields: [['nome', sql.VarChar(255), nome]],
		},
		(result) => {
			if (result.error) result.status = 400
			else result.status = 200
			return res.sendStatus(result.status)
		}
	)
})

// GET todos os eventos dos quais um funcionario participa
// funcionario -> id do funcionario participante
router.get('/eventos/participo', async (req, res) => {
	const funcionario = req.query.funcionario
	if (!funcionario) return res.sendStatus(400)

	executeSql(
		`select * from evex.Participantes where funcionario = @funcionario`,
		{
			fields: [['funcionario', sql.Int, funcionario]],
		},
		(result) => res.json(result)
	)
})

// GET todos os eventos que um funcionario gerencia
// funcionario -> id do funcionario responsável
router.get('/eventos/gerencio', async (req, res) => {
	const funcionario = req.query.funcionario
	if (!funcionario) return res.sendStatus(400)

	executeSql(
		`select * from evex.Evento where responsavel = @funcionario`,
		{
			fields: [['funcionario', sql.Int, funcionario]],
		},
		(result) => res.json(result)
	)
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
			if (result.error) result.status = 400
			else result.status = 200
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
		'insert into evex.Evento values(@titulo, @descricao, @responsavel, @tipo, @subtipo, @datahora, @localizacao)',
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
			return res.sendStatus(result.status)
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
			return res.sendStatus(result.status)
		}
	)
})

// GET todos os tipos de evento
router.get('/tipos', async (req, res) => {
	executeSql(`select * from evex.TipoEvento`, null, (result) =>
		res.json(result)
	)
})

// GET todos os subtipos de evento
router.get('/subtipos', async (req, res) => {
	executeSql(`select * from evex.SubTipoEvento`, null, (result) =>
		res.json(result)
	)
})

// GET todos os locais de evento
router.get('/locais', async (req, res) => {
	executeSql(`select * from evex.Localizacoes`, null, (result) =>
		res.json(result)
	)
})

app.listen(port, () => console.log('O servidor esta ativo'))

const executeSql = async (query, fields, callback) => {
	await poolConnect
	console.log(`[sql] exec: ${query};`)
	try {
		const request = pool.request()
		if (fields)
			fields.fields.forEach((field) => {
				request.input(field[0], field[1], field[2])
			})
		const result = await request.query(query)
		// callback({
		// 	qtd: result.rowsAffected[0],
		// 	resultados: result.recordset,
		// })
		callback(result.recordset)
	} catch (err) {
		console.error(err)
		callback({
			rowsAffected: 0,
			recordset: [],
			error: err,
		})
	}
}
