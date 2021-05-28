//Bruno     19164
//Eduardo   19167
//Nicolas   19191

const express = require('express')
const bodyParser = require('body-parser')
const sql = require('mssql')

const config = require('./config.json')

const app = express()
const port = 3000
const sqlConfig = config.sqlConfig

sql.connect(sqlConfig)
	.then((conn) => (global.conn = conn))
	.catch((err) => console.log(err))

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const router = express.Router()

router.get('/', (req, res) => res.json({ mensagem: 'A API esta ativa' }))
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
	const funcionario = req.body.funcionario
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
			res.sendStatus(result.status)
			return
		}
	)
})

// GET todos os eventos dos quais um funcionario participa
// funcionario -> id do funcionario participante
router.get('/eventos', async (req, res) => {
	const funcionario = req.body.funcionario
	if (!funcionario) return res.sendStatus(400)

	executeSql(
		`select * from evex.Participantes where funcionario = @funcionario`,
		{
			fields: [['funcionario', sql.VarChar(255), funcionario]],
		},
		(result) => res.json(result)
	)
})

// POST cria um novo evento
router.post('/eventos', async (req, res) => {
	const titulo = req.body.titulo
	const tipo = req.body.tipo
	const subtipo = req.body.subtipo
	const datahora = req.body.datahora
	const responsavel = req.body.responsavel
	if (!titulo || !tipo || !datahora || !responsavel)
		return res.sendStatus(400)

	executeSql(
		'insert into evex.Evento values(@titulo, @tipo, @subtipo, @datahora, @responsavel)',
		{
			fields: [
				['titulo', sql.VarChar(255), titulo],
				['tipo', sql.VarChar(255), tipo],
				['subtipo', sql.VarChar(255), subtipo],
				['datahora', sql.DateTime, datahora],
				['responsavel', sql.Int, responsavel],
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
	const id = req.body.id
	const titulo = req.body.titulo
	const tipo = req.body.tipo
	const subtipo = req.body.subtipo
	const datahora = req.body.datahora
	const responsavel = req.body.responsavel
	if (!id || !titulo || !tipo || !datahora || !responsavel)
		return res.sendStatus(400)

	executeSql(
		'update evex.Evento set titulo = @titulo, tipo = @tipo, subtipo = @subtipo, datahora = @datahora, responsavel = @responsavel where id = @id',
		{
			fields: [
				['id', sql.Int, id],
				['titulo', sql.VarChar(255), titulo],
				['tipo', sql.VarChar(255), tipo],
				['subtipo', sql.VarChar(255), subtipo],
				['datahora', sql.DateTime, datahora],
				['responsavel', sql.Int, responsavel],
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
	try {
		const request = pool.request()
		if (fields)
			fields.fields.forEach((field) => {
				request.input(field[0], field[1], field[2])
			})
		const result = await request.query(query)
		let resParse = []
		result.recordset.forEach((res) => {
			resParse.push({ ra: res.RA, nome: res.Nome, email: res.Email })
		})
		callback({
			rowsAffected: result.rowsAffected[0],
			recordset: resParse,
		})
	} catch (err) {
		let error
		try {
			let dbError = err.originalError.info.message
			if (dbError.includes('Violation of PRIMARY KEY'))
				error = 'Registro já existe'
		} catch (e) {}
		callback({
			rowsAffected: 0,
			recordset: [],
			error: error,
		})
	}
}
