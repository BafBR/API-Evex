//Bruno     19164
//Eduardo   19167
//Nicolas   19191

const express = require('express')
const bodyParser = require('body-parser')
const sql = require('mssql')

const app = express()
const port = 3000
const connStr = process.env.CONN_STRING

sql.connect(connStr)
	.then((conn) => (global.conn = conn))
	.catch((err) => console.log(err))

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const router = express.Router()

router.get('/', (req, res) => res.json({ mensagem: 'A API esta ativa' }))
app.use('/', router)

// POST cadastrar novo funcionario
router.post('/funcionario', async (req, res) => {
	const nome = req.body.nome
    const apelido = req.body.apelido
	const departamento = req.body.departamento

	execSQLQuery(`insert into evex.Funcionario values(nome = ${nome}, apelido = ${apelido}, departamento = ${departamento})`)
})

// DELETE um funcionario
router.delete('/funcionario', async (req, res) => {
	const id = req.body.id
	execSQLQuery(`delete from evex.Funcionario where id = ${id}`)
    res.sendStatus(200)
})

// PUT editar dados de um funcionario
router.put('/funcionario', async (req, res) => {
	const id = req.body.id
	const nome = req.body.nome
    const apelido = req.body.apelido
	const departamento = req.body.departamento
	execSQLQuery(`update evex.Funcionario set nome = ${nome}, apelido = ${apelido}, departamento = ${departamento} where id = ${id}`)
    res.sendStatus(200)
})

// GET todos os funcionarios
router.get('/funcionarios', (req, res) => {
    const funcionarios = await execSQLQuery(`select * from evex.Funcionario`)
    res.send({res: funcionarios})
})

// GET um funcionario
// funcionario -> id do funcionario
router.get('/funcionario', (req, res) => {
    const funcionario = req.body.funcionario
    const eventos = await execSQLQuery(`select * from evex.Funcionario where funcionario = ${funcionario}`)
    res.send({res: eventos})
})

// GET todos os departamentos
router.get('/departamentos', (req, res) => {
    const departamento = await execSQLQuery(`select * from evex.Departamento`)
    res.send({res: departamento})
})

// GET todos os eventos dos quais um funcionario participa
// funcionario -> id do funcionario participante
router.get('/eventos', (req, res) => {
    const funcionario = req.body.funcionario
    const eventos = await execSQLQuery(`select * from evex.Participantes where funcionario = ${funcionario}`)
    res.send({res: eventos})
})

// POST cria um novo evento
// responsavel -> id do funcionario responsavel
router.post('/eventos', (req, res) => {
    const titulo = req.body.titulo
    const tipo = req.body.tipo
    const subtipo = req.body.subtipo
    const datahora = req.body.datahora
    const responsavel = req.body.responsavel
    const eventos = await execSQLQuery(`insert into evex.Participantes values(titulo = ${titulo}, tipo = ${tipo}, subtipo = ${subtipo},
                                        datahora = ${datahora}, responsavel = ${responsavel}`)
    res.send({res: eventos})
})

// POST cria um novo evento
// responsavel -> id do funcionario responsavel
router.put('/eventos', (req, res) => {
    const id = req.body.id
    const titulo = req.body.titulo
    const tipo = req.body.tipo
    const subtipo = req.body.subtipo
    const datahora = req.body.datahora
    const responsavel = req.body.responsavel
    const eventos = await execSQLQuery(`update evex.Participantes set titulo = ${titulo}, tipo = ${tipo}, subtipo = ${subtipo},
                                        datahora = ${datahora}, responsavel = ${responsavel} where id = ${id}`)
    res.send({res: eventos})
})

// GET todos os tipos de evento
router.get('/tipos', (req, res) => {
    const tipos = await execSQLQuery(`select * from evex.TipoEvento`)
    res.send({res: tipos})
})

// GET todos os subtipos de evento
router.get('/subtipos', (req, res) => {
    const subtipos = await execSQLQuery(`select * from evex.SubTipoEvento`)
    res.send({res: subtipos})
})

// GET todos os locais de evento
router.get('/locais', (req, res) => {
    const locais = await execSQLQuery(`select * from evex.Localizacoes`)
    res.send({res: locais})
})

app.listen(port).then(() => console.log('O servidor esta ativo'))

function execSQLQuery(sqlQry) {
	return global.conn.request().query(sqlQry)
}