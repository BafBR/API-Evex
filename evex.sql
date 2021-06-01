create schema evex;
go

create table evex.Departamento (
	id int identity(1,1) primary key,
	nome varchar(255) not null
);

create table evex.Funcionario (
	id int identity(1,1) primary key,
	nome varchar(255) not null,
	apelido varchar(255) null,
	departamento int foreign key references evex.Departamento(id) not null
);

create table evex.TipoEvento (
	id int identity(1,1) primary key,
	tipo varchar(255) not null
);

create table evex.SubTipoEvento (
	id int identity(1,1) primary key,
	tipo int foreign key references evex.TipoEvento(id) not null,
	subtipo varchar(255) not null
);

create table evex.Localizacao (
	id int identity(1,1) primary key,
	nome varchar(255) not null
);

create table evex.Evento (
	id int identity(1,1) primary key,
	titulo varchar(255) not null,
	descricao text null,
	responsavel int foreign key references evex.Funcionario(id),
	tipo int foreign key references evex.TipoEvento(id) not null,
	subtipo int foreign key references evex.SubTipoEvento(id) null,
	datahora datetime not null,
	localizacao int foreign key references evex.Localizacao(id) not null
);

create table evex.Participantes (
	id int identity(1,1) primary key,
	evento int foreign key references evex.Evento(id),
	funcionario int foreign key references evex.Funcionario(id),
);
