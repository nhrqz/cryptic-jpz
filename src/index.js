import React, {useState, useRef} from 'react';
import ReactDOM from 'react-dom';
import './index.css';
const cx = require('classnames');
const _ = require('lodash');

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

  const handleClueInput = ({clue, address}, clueList) => {
    setActive(null);
    const nClueList = clueList.slice();
    _.remove(nClueList, ['address', address]);
    setClueList([...nClueList, {clue, address}]);
  }
  // useEffect(() => {

  // })

  return (
    <div className='main'>
      <div>
        <Grid 
          cells={grid} 
          active={active}
          onClick={i => handleClick(i)} 
          onInput={(i, val) => handleInput(i, val, grid)} 
          w={w} h={h}
        />
        <button onClick={() => markLeftWall(active, grid, clueList)} disabled={active % w === 0}>
          Toggle Left Wall
        </button>
        <button onClick={() => markTopWall(active, grid, clueList)} disabled={!(active >= w)}>
          Toggle Top Wall
        </button>
      </div>
      <WordList {...words} 
        onClueInput={(clue) => handleClueInput(clue, clueList)}
      />
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
            <div className='row'>
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
    <div>
      <div>
        <h3>Across</h3>
        {
          props.across.map(word => {
            return (
              <WordItem {...word} 
                onClueInput={(value) => props.onClueInput({
                  clue: value, 
                  address: `${word.number}A`,
                })} 
              />
            )
          })
        }
      </div>
      <div>
        <h3>Down</h3>
        {
          props.down.map(word => {
            return (
              <WordItem {...word} 
                onClueInput={(value) => props.onClueInput({
                  clue: value, 
                  address: `${word.number}D`
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

const WordItem = (props) => {
  return (
    <div className="wordItem">
      <div className="number">{props.number}</div>
      <div className="word">{props.word}</div>
      <div className="clue">
        <input 
          type="text" 
          placeholder="Clue here"
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
    word: cells.map(cell => cell.value ? cell.value : '_').join('')
  }
}

function makeClueList({across, down}) {
  const aClues = across.map(word => ({address: `${word.number}A`, clue: ''}));
  const dClues = down.map(word => ({address: `${word.number}D`, clue: ''}));
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
