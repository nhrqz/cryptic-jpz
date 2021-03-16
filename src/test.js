const _ = require('lodash')

const row = [
    {
        "value": "a",
        "leftWall": false,
        "topWall": false,
        "number": 1
    },
    {
        "value": "b",
        "leftWall": false,
        "topWall": false,
        "number": 2
    },
    {
        "value": "c",
        "leftWall": false,
        "topWall": false,
        "number": 3
    },
    {
        "value": "d",
        "leftWall": false,
        "topWall": false,
        "number": 4
    },
    {
        "value": "e",
        "leftWall": true,
        "topWall": false,
        "number": 5
    },
    {
        "value": "f",
        "leftWall": false,
        "topWall": false,
        "number": 6
    },
    {
        "value": "g",
        "leftWall": false,
        "topWall": false,
        "number": 7
    },
    {
        "value": "h",
        "leftWall": false,
        "topWall": false,
        "number": 8
    }
];

const rowWords = [];
for (let c = 0; c < row.length; c++) {
  const cell = row[c];
  if (cell.leftWall || c === 0) {
    const word = [];
    word.push(cell);
    word.push(..._.takeWhile(row.slice(c + 1), ['leftWall', false]));
    rowWords.push(word);
  }
}
console.log(rowWords);

function makeWordsFromCells(cells) {
  return {
    // number: cells[0].number || '-',
    word: cells.map(cell => cell.value ? cell.value : '_').join('')
  }
}

console.log(rowWords.map(word => makeWordsFromCells(word)));