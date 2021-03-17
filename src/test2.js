const _ = require('lodash');
const state = require('./state.json');
const xmlbuilder = require('xmlbuilder');

const w = 8;
const h = 10;

function makeJPZ({grid, words, clueList, meta}) {
  const xmlObj = {
    'crossword-compiler-applet': {
      'rectangular-puzzle': {
        metadata: {
          ...meta
        },
        crossword: makeGridXml(grid),
        word: makeWordXml(words),
        clues: makeClueXml(clueList)
      }
    }
  }

  const jpz = xmlbuilder.create(xmlObj, {encoding: 'utf-8'});
  return jpz.end();
}

function makeGridXml(grid) {
  const gridObj = {
    grid: {
      '@height': `${h}`,
      '@width': `${w}`,
      '@one-letter-words': 'false',
      'grid-look': { 
        '@numbering-scheme': 'normal',
        '@thick-border': 'true'
      },
      cell: grid.map((cell, index) => {
        return {
          '@x': `${cell.x}`,
          '@y': `${cell.y}`,
          '@number': `${cell.number}`,
          '@solution': cell.value,
          '@left-bar': cell.leftWall ? 'true' : undefined,
          '@top-bar': cell.topWall ? 'true' : undefined,
        }
      })
    }
  }

  return gridObj;
}

function makeWordXml(words) {
  const allWords = [...words.across, ...words.down];
  const wordObj = allWords.map((word, id) => {
    return {
      '@id': `${id + 1}`,
      cells: word.cells.map(cell => {
        return {
          '@x': `${cell.x}`,
          '@y': `${cell.y}`
        }
      })
    }
  });
  return wordObj;
}

function makeClueXml(clues) {
  const aClues = _.sortBy(_.filter(clues, 'isAcross'), 'number');
  const dClues = _.sortBy(_.filter(clues, ['isAcross', false]), 'number');
  const cluesObj = [
    {
      title: {
        b: 'Across'
      },
      clue: aClues.map((aClue, id) => {
        return {
          '@number': `${aClue.number}`,
          '@word': `${id + 1}`,
          span: aClue.clue
        }
      })
    },
    {
      title: {
        b: 'Down'
      },
      clue: dClues.map((dClue, id) => {
        return {
          '@number': `${dClue.number}`,
          '@word': `${id + aClues.length + 1}`,
          span: dClue.clue
        }
      })
    }
  ];

  return cluesObj;
}

console.log(makeJPZ(state))
