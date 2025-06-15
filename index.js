const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Conexão usando Pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    port: 3306,
    password: 'root',
    database: 'PIZZARIA',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Se quiser usar Promises (recomendado):
const promisePool = pool.promise();

// Rota(s) da Tabela CLIENTES
app.route('/clientes')
    .post(async (req, res) => {
        const { nome, telefone, endereco } = req.body;

        if (!nome || !telefone || !endereco) {
            return res.status(400).json({ ERRO: 'Faltou enviar algum dos campos' });
        }

        try {
            await promisePool.query(
                'INSERT INTO CLIENTES (NOME, TELEFONE, ENDERECO, STATUS) VALUES (?, ?, ?, "ATIVA");',
                [nome, telefone, endereco]
            );
            res.status(201).json({ MENSAGEM: `Cliente ${nome} cadastrado com sucesso!` });
        } catch (err) {
            console.error(err);
            res.status(500).json({ ERRO: 'Falha ao cadastrar um cliente!' });
        }
    })
    .get(async (req, res) => {
        const { nome, telefone } = req.query;

        try {
            let [results] = [];
            if (nome) {
                [results] = await promisePool.query(
                    'SELECT * FROM CLIENTES WHERE NOME LIKE ?;',
                    [`%${nome}%`]
                );
            } else if (telefone) {
                [results] = await promisePool.query(
                    'SELECT * FROM CLIENTES WHERE TELEFONE = ?;',
                    [telefone]
                );
            } else {
                return res.status(400).json({ ERRO: 'Pelo menos um dos campos deve ser preenchido!' });
            }
            res.json(results);
        } catch (err) {
            console.error(err);
            res.status(500).json({ ERRO: 'Erro ao buscar cliente!' });
        }
    });

app.route('/clientes/:cod')
    .delete(async (req, res) => {
        const cod = req.params.cod;

        try {
            const [results] = await promisePool.query(
                'DELETE FROM CLIENTES WHERE COD = ?;',
                [cod]
            );

            if (results.affectedRows === 0) {
                return res.json({ MENSAGEM: 'Código de cliente inexistente!' });
            }

            res.status(200).json({ MENSAGEM: `Cliente de COD ${cod} removido com sucesso!` });
        } catch (err) {
            console.error(err);
            res.status(500).json({ ERRO: 'Erro ao remover conta!' });
        }
    })
    .put(async (req, res) => {
        const cod = req.params.cod;
        const { nome, telefone, endereco, status, desativar } = req.body;

        try {
            if (desativar) {
                if (status === 'INATIVA') {
                    return res.json({ MENSAGEM: 'Esta conta já está desativada!' });
                }

                const [results] = await promisePool.query(
                    'UPDATE CLIENTES SET STATUS = "INATIVA" WHERE COD = ?;',
                    [cod]
                );

                if (results.affectedRows === 0) {
                    return res.json({ MENSAGEM: 'Código de cliente inexistente!' });
                }

                return res.status(200).json({ MENSAGEM: 'Conta desativada com sucesso!' });
            } else {
                if (!nome || !telefone || !endereco) {
                    return res.status(400).json({ ERRO: 'Faltou enviar algum dos campos' });
                }

                const [results] = await promisePool.query(
                    'UPDATE CLIENTES SET NOME = ?, TELEFONE = ?, ENDERECO = ?, STATUS = "ATIVA" WHERE COD = ?;',
                    [nome, telefone, endereco, cod]
                );

                if (results.affectedRows === 0) {
                    return res.json({ MENSAGEM: 'Código de cliente inexistente!' });
                }

                res.status(200).json({ MENSAGEM: 'Cliente alterado com sucesso!' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ ERRO: 'Erro ao alterar cliente!' });
        }
    });

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
