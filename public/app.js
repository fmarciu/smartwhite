const resultList = document.getElementById('resultList');
const fullWidthDiv = document.querySelector('#brancosList');
const fullWidthProbabilidadeDiv = document.querySelector('#possiveisList');
const pegaHoraTitulo = document.querySelector('.tituloHora');

let currentId = null; // Variável para armazenar o ID atual
let lastTableId = null; // Variável para armazenar o último ID da tabela
let currentNumber = null; // Variável para armazenar o número atual
let lastHour = null; // Variável para armazenar a última hora observada

function speakNumber(number) {
  const speech = new SpeechSynthesisUtterance();
  speech.text = `Toma, saiu um branquinho!!! Paga nós Blaze!`;
  speech.lang = 'pt-BR';
  window.speechSynthesis.speak(speech);
}

function identificaCorDaPedra(value) {
  const redValues = ['01', '02', '03', '04', '05', '06', '07'];
  const blueValues = ['08', '09', '10', '11', '12', '13', '14'];

  if (redValues.includes(value)) {
    return '#f12c4c';
  } else if (blueValues.includes(value)) {
    return '#262f3c';
  } else if (value === '00') {
    if (currentNumber === '00' && currentId !== lastTableId) {
      speakNumber(value);
      lastTableId = currentId;
    }
    return '#ffffff';
  }
}

function addItemsToList(listElement, items) {
  listElement.innerHTML = ''; // Limpa a lista existente
  for (let i = 0; i < items.length; i++) {
    const item = document.createElement('div');
    item.textContent = items[i];
    listElement.appendChild(item);
  }
}

function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

function displayChunks(listElement, items) {
  const chunks = chunkArray(items, 3);
  listElement.innerHTML = ''; // Limpa a lista existente
  chunks.forEach(chunk => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'center';
    chunk.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.textContent = item;
      itemDiv.style.margin = '2px'; // Espaço entre os itens
      row.appendChild(itemDiv);
    });
    listElement.appendChild(row);
  });
}

async function fetchData() {
  try {
    const response = await fetch('https://smartwhite.com.br/api/data');
    const data = await response.json();

    if (data.data.length > 0) {
      // Limpe a lista existente
      resultList.innerHTML = '';

      // Obter o último ID da tabela
      currentId = data.data[0].id;
      currentNumber = data.data[0].numero;

      // Itere pelos resultados em ordem reversa
      data.data.reverse().forEach(result => {
        const hora = result.hora.substring(0, 5); // Pega apenas os primeiros 5 caracteres (hh:mm)
        const listItem = document.createElement('div');
        listItem.classList.add('result-item'); // Adiciona a classe result-item
                
        // Envolver cada marcador em uma <div>
        listItem.innerHTML = `      
          <div class="itens-roll">Giro: ${result.rodada}</div>
          <div class="itens-roll"><div class="destacadorDeRoll">${result.numero}</div></div>
          <div class="itens-roll">${hora}</div>
          <div class="itens-roll">${result.tempo} min</div>
        `;

        const backgroundColor = identificaCorDaPedra(result.numero);
        
        listItem.style.backgroundColor = backgroundColor;

        // Seleciona o elemento .destacadorDeRoll dentro do listItem atual
        const borderRoll = listItem.querySelector('.destacadorDeRoll');
                       
        if (backgroundColor === '#f12c4c' || backgroundColor === '#262f3c') {
          listItem.style.color = '#ffffff';
          borderRoll.style.borderColor = '#ffffff';
          
        } else if (backgroundColor === '#ffffff') {
          listItem.style.color = '#f12c4c';
          borderRoll.style.borderColor = '#f12c4c';
        }

        // Insira o novo elemento no início da lista
        resultList.insertBefore(listItem, resultList.firstChild);
      });
    }
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
  }
/*

  //verifica se teve win na rodada

  try {
    const dbResponse = await fetch('https://smartwhite.com.br/api/database');
    const dbResult = await dbResponse.json();

    let resultText = `[${dbResult.win}] - ${dbResult.horaFormatada} => ${dbResult.sequence}`;
    fullWidthDiv.textContent = resultText || 'Nenhum resultado encontrado.';

    const colors = {
      Win: { backgroundColor: '#04d47c', color: '#ffffff' },
      LOSS: { backgroundColor: '#f12c4c', color: '#ffffff' },
    };

    if (colors.hasOwnProperty(dbResult.win)) {
      const { backgroundColor, color } = colors[dbResult.win];
      fullWidthDiv.style.backgroundColor = backgroundColor;
      fullWidthDiv.style.color = color;
    } else {
      fullWidthDiv.textContent = 'Nenhum resultado encontrado.';
      fullWidthDiv.style.backgroundColor = '#f1f2f3';
      fullWidthDiv.style.color = '#000000';
    }
  } catch (error) {
    console.error('Erro ao buscar dados do banco de dados:', error);
    fullWidthDiv.textContent = 'Nenhum resultado encontrado.';
  }

  //Código dos melhores giros para hora

  try {
    // Verificar a mudança de hora
    const currentHour = new Date().getHours();

    if (currentHour !== lastHour) {
      // A hora mudou, execute o trecho de código
      lastHour = currentHour;

      // Seu trecho de código
      const melhorGiroDb = await fetch('https://smartwhite.com.br/api/girospossiveis');
      const melhorGiroDbResult = await melhorGiroDb.json();
      fullWidthProbabilidadeDiv.textContent = `Melhores giros para ${melhorGiroDbResult.formatarHoraAtual} = ${melhorGiroDbResult.rodada}`;
    }
  } catch (error) {
    console.error('Erro ao buscar informações de giros:', error);
    fullWidthProbabilidadeDiv.textContent = 'Nenhuma informação de giros disponível.';
  }
  */

  try {
    // Verificar a mudança de hora
    const currentHour = new Date().getHours();

    if (currentHour !== lastHour) {
      // A hora mudou, execute o trecho de código
      lastHour = currentHour;

      // Seu trecho de código
      const response = await fetch('https://smartwhite.com.br/api/minutosfortes');
      const data = await response.json();
      if (data.momentos && data.momentos.length > 0) {
        const momentos = data.momentos.flatMap(m => [m.inicio, m.minuto, m.fim]);
        const texto = `${momentos.join(', ')}`;
        fullWidthProbabilidadeDiv.textContent = texto;
      } else {
        fullWidthProbabilidadeDiv.textContent = 'Nenhum dado disponível.';
      }
    }
  } catch (error) {
    console.error('Erro ao buscar informações de giros:', error);
    fullWidthProbabilidadeDiv.textContent = 'Nenhuma informação de minutos disponível.';
  }

  try {
    const dbResponse = await fetch('https://smartwhite.com.br/api/minutoshora');
    const dbResult = await dbResponse.json();

    let resultText = `${dbResult.sequence}`;
    let horaTitulo = `Brancos do Horário de ${dbResult.horaFormatada}`;
    fullWidthDiv.textContent = resultText || 'Nenhum resultado encontrado.';
    pegaHoraTitulo.textContent = horaTitulo;
    if (dbResult.sequence) {
      const sequenceArray = dbResult.sequence.split(',');
    }

  } catch (error) {
    console.error('Erro ao buscar dados do banco de dados:', error);
    fullWidthDiv.textContent = 'Nenhum resultado encontrado.';
  }
  
  setTimeout(fetchData, 1000);
}

fetchData();

function formatCurrency(input) {
  let value = input.value.replace(/\D/g, '');
  value = (value / 100).toFixed(2);
  value = value.replace(".", ",");
  value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  input.value = `R$ ${value}`;
}

function calcularEntrada() {
  const valorDaBancaElement = document.getElementById("valorDaBanca");
  const taxaDesejadaElement = document.getElementById("taxaDesejada");

  let valorDaBanca = valorDaBancaElement.value.replace(/\D/g, '');
  valorDaBanca = parseFloat(valorDaBanca) / 100;
  
  const taxaDesejada = parseFloat(taxaDesejadaElement.value);
  const fatorMultiplicador = ((taxaDesejada / 100 * 0.001256) * valorDaBanca) * 100;
  const valorDeEntrada = fatorMultiplicador;

  const valorDeEntradaFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorDeEntrada);

  document.getElementById("resultadoEntrada").innerText = `Valor da entrada inicial: ${valorDeEntradaFormatado}`;
}
