import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import React, {useState, useRef} from 'react';
import ReactDOM from 'react-dom';
import './index.css';
const cx = require('classnames');
const _ = require('lodash');
const xmlbuilder = require('xmlbuilder');
const he = require('he');

const w = 8;
const h = 10;
const cell = {
  value: '',
  leftWall: false,
  topWall: false,
}

const App = () => {
  const initialGrid = numberGrid(Array(w * h).fill(cell));
  const initialActive = null;
  const initialWords = makeWordsFromGrid(initialGrid);
  const initialClues = makeClueList(initialWords);

  const [grid, setGrid] = useState(initialGrid);
  const [active, setActive] = useState(initialActive);
  const [words, setWords] = useState(initialWords);
  const [clueList, setClueList] = useState(initialClues);
  const [meta, setMeta] = useState({title: '', creator: ''});

  const handleClick = (i) => {
    setActive(i);
  }

  const handleInput = (active, val, grid) => {
    const ngrid = grid.slice();
    ngrid[active] = { ...ngrid[active], value: val.toUpperCase() };
    setGrid(numberGrid(ngrid));
    setWords(makeWordsFromGrid(ngrid));
    if (val.length === 1) {
      setActive(active+1);
    }
  }
  
  const markTopWall = (active, grid) => {
    const ngrid = grid.slice();
    ngrid[active] = {...ngrid[active], topWall: !ngrid[active].topWall};
    setGrid(numberGrid(ngrid));
    const nWords = makeWordsFromGrid(ngrid);
    setWords(nWords);
    setClueList(stripClueList(clueList, nWords));
  }
  
  const markLeftWall = (active, grid) => {
    const ngrid = grid.slice();
    ngrid[active] = {...ngrid[active], leftWall: !ngrid[active].leftWall};
    setGrid(numberGrid(ngrid));
    const nWords = makeWordsFromGrid(ngrid);
    setWords(nWords);
    setClueList(stripClueList(clueList, nWords));
  }

  const handleClueInput = (newClue, clueList) => {
    setActive(null);
    const nClueList = clueList.slice();
    _.remove(nClueList, ['address', newClue.address]);
    setClueList([...nClueList, newClue]);
  }

  const handleMetaInput = (newMeta) => {
    setActive(null);
    setMeta({...meta, ...newMeta});
  }
  
  const disableJpz = () => {
    return (clueList.map(x => x.clue).includes('') || grid.map(y => y.value).includes('')) 
      || !(clueList.length === words.across.length + words.down.length);
    // return true;
  }

  const jpzHref = () => {
    if (!disableJpz()) {
      return `data:${'application/xml'};base64,${btoa(makeJPZ(grid, words, clueList, meta))}`
      // return `data:${'application/xml'},${encodeURI(mazkeJPZ(grid, words, clueList, meta))}`
    } else {
      return undefined;
    }
  }

  return (
    <>
      <div className={cx('container-fluid')}>
        <div className={cx('row')}>
          <div className={cx('col-5')}>
            <div className={cx('d-flex', 'justify-content-center', 'sticky-top')}>
              <div className={cx('py-4')}>
                <Grid 
                  cells={grid} 
                  active={active}
                  onClick={i => handleClick(i)} 
                  onInput={(i, val) => handleInput(i, val, grid)} 
                  w={w} h={h}
                />
                <div className={cx('mt-3')}>
                  <button 
                    onClick={() => markLeftWall(active, grid, clueList)} 
                    disabled={active % w === 0}
                    type='button'
                    className={cx('btn', 'btn-secondary', 'me-2')}
                  >
                    Toggle Left Wall
                  </button>
                  <button 
                    onClick={() => markTopWall(active, grid, clueList)} 
                    disabled={!(active >= w)}
                    type='button'
                    className={cx('btn', 'btn-secondary')}
                  >
                    Toggle Top Wall
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div 
            className={cx('col-7', 'row', 'gy-4', 'mb-5')}
          >
            <MetaInput onMetaInput={(meta) => handleMetaInput(meta)}/> 
            <WordList {...words} 
              onClueInput={(clue) => handleClueInput(clue, clueList)}
            />
            <a 
              className='d-grid'
              href={jpzHref()}
              download={`${meta.title}.jpz`}
            >
              <button 
              disabled={disableJpz()}
              className={cx('btn', 'btn-lg', 'btn-primary')}
                // onClick={console.log(JSON.stringify({ grid, words, clueList, meta}))}
              >Download JPZ</button>
            </a>
          </div>
        </div>
      </div>
      <Explainer/>
    </>
  )
}

const Explainer = () => {
  return (
    <div 
      className={cx('offcanvas', 'offcanvas-bottom', 'show')}
      tabIndex="-1" 
      id="offcanvas" 
      // aria-labelledby="offcanvasLabel" 
      data-bs-backdrop="true" 
      data-bs-scroll="true"
    >
      <div className={cx('p-3')}>
        <div className="offcanvas-header">
          <h3 className="offcanvas-title" id="offcanvasLabel">
            TNY-Style Cryptic Crossword JPZ Generator
          </h3>
          <button 
            type="button" 
            className="btn-close text-reset" 
            data-bs-dismiss="offcanvas" 
            aria-label="Close" 
          />
        </div>
        <div className="offcanvas-body">
          <p><b>How to use:</b></p>
          <ol>
            <li>Add letters and walls to the grid.</li>
            <li>Add a clue for each word. (Don’t forget to use smart quotes and include enumerations!)</li>
            <li>Download your JPZ file!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

const Grid = (props) => {
  // const nCells = numberGrid(props.cells);
  const rows = _.chunk(props.cells, props.w);
  return (
    <div className='grid'>
      {
        rows.map((row, i) => {
          return (
            <div className='grid-row'>
              {
                row.map((cell, j) => {
                  const nx = i * w + j;
                  return <Cell 
                    key = {nx} 
                    active = {props.active === nx}
                    onClick = {() => props.onClick(nx)} 
                    onFocus = {() => props.onClick(nx)}
                    onInput = {(value) => props.onInput(nx, value)}
                    {...cell}
                  />
                })
              } 
            </div>
          )
        })
      }
    </div>
  )
}

const Cell = (props) => {
  const [inputRef, setInputFocus] = useFocus();
  if (props.active) {setInputFocus();}
  return (
    <div
      className={cx(
        'cell',
        props.active ? 'active' : null,
        props.leftWall ? 'leftWall' : null, 
        props.topWall ? 'topWall' : null, 
      )}
      onClick={() => {props.onClick(); setInputFocus();}}
    >
      <div className={cx('number')}>{props.number}</div>
      <input 
        className={cx('value')}
        type='text'
        maxLength='1'
        onInput={e => props.onInput(e.target.value)}
        onFocus={props.onFocus}
        ref={inputRef}
      />
    </div>
  )
}

const WordList = (props) => {
  return (
    <div className={cx()}>
      <div className={cx('mb-4')}>
        <h3 className={cx('mb-3')}>Across</h3>
        {
          props.across.map(word => {
            return (
              <WordItem {...word} 
                onClueInput={(value) => props.onClueInput({
                  clue: value, 
                  address: `${word.number}A`,
                  number: word.number,
                  isAcross: true
                })} 
              />
            )
          })
        }
      </div>
      <div className={cx('mb-4')}>
        <h3 className={cx('mb-3')}>Down</h3>
        {
          props.down.map(word => {
            return (
              <WordItem {...word} 
                onClueInput={(value) => props.onClueInput({
                  clue: value, 
                  address: `${word.number}D`,
                  number: word.number,
                  isAcross: false
                })} 
              />
            )
          })
        }
      </div>
      <div><i>{props.across.length + props.down.length} words</i></div> 
    </div>
  )
}

const MetaInput = (props) => {
  return (
    <>
      <div className={cx('row', 'mb-2')}>
        <div className={cx('col-6')}>
          <input
            type="text"
            placeholder="Title"
            className={cx('form-control', 'form-control-lg')}
            onInput={e => props.onMetaInput({title: e.target.value})}
          />
        </div>
      </div>
      <div className={cx('row')}>
        <div className={cx('col-4')}>
          <input
            type="text"
            placeholder="Creator"
            className={cx('form-control')}
            onInput={e => props.onMetaInput({creator: e.target.value})}
          />
        </div>
      </div>
    </>
  )
}

const WordItem = (props) => {
  return (
    <div className={cx('row', 'mb-1')}>
      <div className={cx('wi-number')}>{props.number}</div>
      <div className={cx('col')}>{props.word}</div>
      <div className={cx('col-9')}>
        <input 
          type="text" 
          placeholder={`Clue (${props.word.length})`}
          className={cx('form-control')}
          onInput={e => props.onClueInput(e.target.value)}
        />
      </div>
    </div>
  )
}

function numberGrid(grid) {
  let n = 1;
  for (let i=0; i < grid.length; i++) {
    const self = grid[i];

    self.index = i; 
    self.x = (i % w) + 1;
    self.y = Math.floor(i / w) + 1;

    const north = i < w          ? null : grid[i - w];
    const south = i > (w * h-1)  ? null : grid[i + w];
    const west = (i % w === 0)   ? null : grid[i-1];
    const east = (i % w === w-1) ? null : grid[i+1];
    // number the down words first
    if ((self.topWall && south && !south.topWall) || (!north && !south.topWall)) {
      grid[i] = { ...grid[i], number: n};
      n++;
    } else if ((self.leftWall && east && !east.leftWall) || (!west && !east.leftWall)) {
      grid[i] = { ...grid[i], number: n };
      n++;
    } else {
      grid[i] = { ...grid[i], number: undefined};
    }
  }
  return grid;
}

function makeWordsFromGrid(grid) {
  const acrossWords = [];
  const downWords = [];
  const rows = _.chunk(grid, w);
  const cols = _.zip(...rows);
  for (let row of rows) {
    const rowWords = [];
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (cell.leftWall || c === 0) {
        const word = [];
        word.push(cell, ..._.takeWhile(row.slice(c + 1), ['leftWall', false]));
        rowWords.push(word);
      }
    }
    acrossWords.push(...rowWords);
  }
  for (let col of cols) {
    const colWords = [];
    for (let c = 0; c < col.length; c++) {
      const cell = col[c];
      if (cell.topWall || c === 0) {
        const word = [];
        word.push(cell, ..._.takeWhile(col.slice(c + 1), ['topWall', false]));
        colWords.push(word);
      }
    }
    downWords.push(...colWords);
  }
  return {
    across: acrossWords
      .filter(word => word.length > 1)
      .map(word => makeWordsFromCells(word)),
    down: _.sortBy(downWords
      .filter(word => word.length > 1)
      .map(word => makeWordsFromCells(word)),
      ['number']
    )
  }
}

function makeWordsFromCells(cells) {
  return {
    number: cells[0].number || '-',
    word: cells.map(cell => cell.value ? cell.value : '_').join(''),
    cells: cells.map(({x, y}) => ({x, y}))
  }
}

function makeClueList({across, down}) {
  const aClues = across.map(word => {
    return {
      address: `${word.number}A`, 
      clue: '',
      number: word.number,
      isAcross: true
    }
  });
  const dClues = down.map(word => {
    return {
      address: `${word.number}D`,
      clue: '',
      number: word.number,
      isAcross: false
    }
  });
  return _.concat(aClues, dClues);
}

function stripClueList(clueList, {across, down}) {
  const validAddresses = _.concat(
    across.map(word => (`${word.number}A`)),
    down.map(word => (`${word.number}D`))
  )
  return clueList.filter(({address}) => validAddresses.includes(address));
}

const useFocus = () => {
  const htmlElRef = useRef(null)
  const setFocus = () => { htmlElRef.current && htmlElRef.current.focus() }

  return [htmlElRef, setFocus]
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);


// make JPZ xml

function makeJPZ(grid, words, clues, meta) {
  const xmlObj = {
    'crossword-compiler-applet': {
      'rectangular-puzzle': {
        metadata: {
          title: he.encode(meta.title, {decimal: true}),
          creator: he.encode(meta.creator, {decimal: true})
        },
        crossword: {
          grid: makeGridXml(grid),
          word: makeWordXml(words),
          clues: makeClueXml(clues)
        }
      }
    }
  }

  //
  const jpz = xmlbuilder.create(xmlObj, {noDoubleEncoding: true});
  return jpz.end();
}

function makeGridXml(grid) {
  const gridObj = {
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
        '@solution': cell.value,
        '@number': cell.number,
        '@left-bar': cell.leftWall ? 'true' : undefined,
        '@top-bar': cell.topWall ? 'true' : undefined,
      }
    })
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
          span: he.encode(aClue.clue, {decimal: true})
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
          span: he.encode(dClue.clue, {decimal: true})
        }
      })
    }
  ];

  return cluesObj;
}
