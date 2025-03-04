const express = require('express');
const path = require('path');
const moment = require('moment');
const mysql = require('mysql2');
const { appendFile } = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Rota para o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Crie um pool de conexão MySQL
const pool = mysql.createPool({
  host: '191.101.78.41',
  user: 'maquinaRodrigo',
  password: 'Vid@Lok@.',
  database: 'dbbrancos',
  connectionLimit: 10, // Defina o tamanho do pool de conexão conforme necessário
});

let armazenaMelhoresGirosDaHoraAtual = null;

// Função para formatar string com número 0 à esquerda
function formatarZeroAEsquerda(numero) {
  return numero.toString().padStart(2, '0');
}

app.get('/api/data', async (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Erro ao obter conexão do pool:', err);
      res.status(500).json({ error: 'Erro ao obter conexão do pool' });
      return;
    }

    connection.query('SELECT * FROM roleta ORDER BY id DESC LIMIT 28', (err, rows) => {
      // Lide com a consulta como antes

      // Após concluir a consulta, libere a conexão de volta para o pool
      connection.release();

      if (err) {
        console.error('Erro ao buscar dados do banco de dados:', err);
        res.status(500).json({ error: 'Erro ao buscar dados do banco de dados' });
        return;
      }

      // Mapeie os resultados em um formato adequado para o front-end, se necessário
      const formattedData = rows.map(row => ({
        id: row.id,
        hora: row.hora,
        numero: formatarZeroAEsquerda(row.numero),
        cor: row.cor,
        rodada: formatarZeroAEsquerda(row.rodada),
        tempo: row.tempo
      }));

      res.json({ data: formattedData });
    });
  });
});

app.get('/api/database', (req, res) => {
  let day = new Date();
  let pegaHora = moment(day).format("HH");
  let pegaDia = moment(day).format("YYYY/MM/DD");

  pool.getConnection((err, connection) => { // Obter uma conexão do pool
    if (err) {
      console.error('Erro ao obter conexão do pool:', err);
      res.status(500).json({ error: 'Erro ao obter conexão do pool' });
      return;
    }

    connection.query(`SELECT id, rodada FROM rodadas WHERE dia = '${pegaDia}' AND hora BETWEEN '${pegaHora}:00:00' AND '${pegaHora}:59:59' ORDER BY id;`, (err, rows) => {
      // Lide com a consulta como antes

      // Após concluir a consulta, libere a conexão de volta para o pool
      connection.release();

      if (err) throw err;

      let result = {}; // Inicializa um objeto para armazenar o resultado

      if (rows.length > 0) { // Verifica se há resultados
        const sequence = rows.map(row => row.rodada);

        const verificaIntervalosRepetidos = armazenaMelhoresGirosDaHoraAtual.some(value => sequence.includes(value));

        let win = '';

        if (verificaIntervalosRepetidos) {
          win = 'Win';
        } else {
          win = 'LOSS';
        }

        const horaFormatada = pegaHora.toString().padStart(2, '0') + 'hs';

        result = {
          win: win,
          horaFormatada: horaFormatada,
          sequence: sequence.join(', ')
        };
      } else {
        result = { message: 'Nenhum resultado encontrado.' };
      }

      res.json(result);
    });
  });
});

app.get('/api/girospossiveis', async (req, res) => {
  let day = new Date();
  let pegaHora = moment(day).format("HH");
  let pegaDiaAnterior = moment(day).subtract(1, 'day').format('YYYY-MM-DD');

  pool.getConnection((err, connection) => { // Obter uma conexão do pool
    if (err) {
      console.error('Erro ao obter conexão do pool:', err);
      res.status(500).json({ error: 'Erro ao obter conexão do pool' });
      return;
    }

    connection.query(`select rodada, count(rodada) as quantidade from rodadas where hora between '${pegaHora}:00:00' and '${pegaHora}:59:59' and dia between '2023-01-01' and '${pegaDiaAnterior}' group by rodada order by quantidade desc limit 6`, (err, rows) => {
      // Lide com a consulta como antes

      // Após concluir a consulta, libere a conexão de volta para o pool
      connection.release();

      if (err) {
        console.error('Erro ao buscar dados do banco de dados:', err);
        res.status(500).json({ error: 'Erro ao buscar dados do banco de dados' });
        return;
      }

      let armazenarDadosConsulta = {}; // Inicializa um objeto para armazenar o resultado

      const rodada = rows.map(row => row.rodada);
      rodada.sort((a, b) => a - b);
      armazenaMelhoresGirosDaHoraAtual = rodada;

      const formatarHoraAtual = pegaHora.toString().padStart(2, '0') + 'hs';

      armazenarDadosConsulta = {
        formatarHoraAtual: formatarHoraAtual,
        rodada: rodada.join(', ')
      };

      res.json(armazenarDadosConsulta);
    });
  });
});

app.get('/api/minutosfortes', async (req, res) => {
  // Obtenha a hora específica, se fornecida, ou use a hora atual.
  const horaEspecifica = req.query.hora || moment().format("HH");

  try {
    const [results] = await pool.promise().query(`
      SELECT DATE_FORMAT(hora, '%H:%i') AS hora_formatada, COUNT(numero) AS qtd
      FROM dadosbrancos
      WHERE HOUR(hora) = ? AND MINUTE(hora) BETWEEN 0 AND 59
      GROUP BY hora_formatada
      ORDER BY qtd DESC
      LIMIT 4;
    `, [horaEspecifica]);
    
    // Ordenando resultados por minutos crescente
    let campeoesMinutos = results.sort((a, b) => a.hora_formatada.localeCompare(b.hora_formatada));

    const minutos = campeoesMinutos.map(result => result.hora_formatada);
    const [primeiroMinuto, segundoMinuto, terceiroMinuto, quartoMinuto] = minutos;

    // Criar momentos para cada um dos minutos mais frequentes
    const momentos = [primeiroMinuto, segundoMinuto, terceiroMinuto, quartoMinuto].map(minuto => {
      const momento = moment(minuto, 'HH:mm');
      return {
        inicio: momento.clone().subtract(1, 'minutes').format('HH:mm'),
        minuto: momento.format('HH:mm'),
        fim: momento.clone().add(1, 'minutes').format('HH:mm')
      };
    });

    res.json({ momentos });
  } catch (err) {
    console.error('Erro ao executar a consulta na base de dados:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/minutoshora', (req, res) => {
  let day = new Date();
  let pegaHora = moment(day).format("HH");
  let pegaDia = moment(day).format("YYYY/MM/DD");

  pool.getConnection((err, connection) => { // Obter uma conexão do pool
    if (err) {
      console.error('Erro ao obter conexão do pool:', err);
      res.status(500).json({ error: 'Erro ao obter conexão do pool' });
      return;
    }

    connection.query(`SELECT id, date_format(hora, '%H:%i') as hora FROM rodadas WHERE dia = '${pegaDia}' AND hora BETWEEN '${pegaHora}:00:00' AND '${pegaHora}:59:59' ORDER BY id;`, (err, rows) => {
      // Lide com a consulta como antes

      // Após concluir a consulta, libere a conexão de volta para o pool
      connection.release();

      if (err) throw err;

      let result = {}; // Inicializa um objeto para armazenar o resultado

      if (rows.length > 0) { // Verifica se há resultados
        const sequence = rows.map(row => row.hora);
        const horaFormatada = pegaHora.toString().padStart(2, '0') + 'hs';

        result = {
          horaFormatada: horaFormatada,
          sequence: sequence.join(', ')
        };
      } else {
        result = { message: 'Nenhum resultado encontrado.' };
      }

      res.json(result);
    });
  });
});

// Iniciar o servidor HTTP
app.listen(PORT, () => {
  console.log(`Servidor HTTP rodando na porta ${PORT}`);
});
