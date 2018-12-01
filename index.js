const axios = require('axios');
const baseUrl = 'http://ec2-34-216-8-43.us-west-2.compute.amazonaws.com';
let tokenUrl;
const actionList = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

/* class Maze {
 *   constructor(matrix, height, width, xc, yc) {
 *     this.matrix = matrix;
 *     this.status = {height, width, xc, yc};
 *   }  
 * } */

async function getToken() {
  let res = await axios({
    method: 'post',
    url: `${baseUrl}/session`,
    data: {
      uid: '204996814'
    }
  })
  return `/game?token=${res.data.token}`;
}

async function getMazeStatus(url) {
  let res = await axios.get(url);
  return res.data;
}


function updateMaze(maze, type, xc, yc) {
  let typeMap = {
    WALL: 8,
    SUCCESS: 1
  }
  return maze.map((row, y) => {
    return row.map((cell, x) => {
      if (y === yc && x === xc)
 	return typeMap[type];
      else
 	return maze[y][x];
    });
  });
}

async function findPath(maze, xc, yc) {
  let up = await tryMove(maze, 'UP', xc, yc);
  let down = await tryMove(maze, 'DOWN', xc, yc);
  let left = await tryMove(maze, 'LEFT', xc, yc);
  let right = await tryMove(maze, 'RIGHT', xc, yc);
  return up || down || left || right;
}


function checkCoord(maze, x, y) {
  if (y >= maze.length || y < 0 || x >= maze[0].length || x < 0)
    return false;
  let coord = maze[y][x];
  if (coord)
    return false;
  return true;
}

function newCoord(action, xc, yc) {
  switch(action) {
    case 'UP': return {x: xc, y: yc - 1};
    case 'DOWN': return {x: xc, y: yc + 1};
    case 'LEFT': return {x: xc - 1, y: yc};
    case 'RIGHT': return {x: xc + 1, y: yc};
  }
}

async function tryMove(maze, action, xc, yc) {
  let newc = newCoord(action, xc, yc);
  console.log(`try move ${action} to ${newc.x}, ${newc.y}`)

  // If cannot move to this point, return false
  if (!checkCoord(maze, newc.x, newc.y))
    return false;

  // Use api call to check new position information
  let res, result;
  try {
    res = await axios({
      method: 'post',
      url: `${baseUrl}${tokenUrl}`,
      data: {action}
    });
    result = res.data.result;
  } catch(err) {
    //    console.log(err);
  }

  // Change the maze status accordingly
  switch (result) {
    case 'WALL': {
      console.log('wall!')
      maze[newc.y][newc.x] = 8;
      wallList.push({x: newc.x, y: newc.y});
      //      console.log(maze)
      return false;
    }
    case 'OUT_OF_BOUNDS': {
      console.log('out of bounds!');
      return false;
    }
    case 'END': {
      console.log('end!');
      return 'END';
    }
    case 'SUCCESS': {
      console.log('success!');
      maze[newc.y][newc.x] = 1;
      return true;
    }
  }
}

async function startGame() {
  // Get the token
  let status;
  try {
    tokenUrl = await getToken();
  } catch(err) {
    console.log(err);
  }

  // Get the maze status
  try {
    status = await getMazeStatus(baseUrl + tokenUrl);
    console.log(status);
  } catch(err) {
    console.log(err);
  }  

  // Contruct the local copy of the maze
  let [height, width] = status.maze_size;
  let [xc, yc] = status.current_location;
  let matrix = [];
  for (let i = 0; i < height; i++) {
    matrix[i] = [];
    for (let j = 0; j < width; j++)
      matrix[i][j] = 0;
  }
  matrix[yc][xc] = 1;


  


  let result = await findPath(matrix, xc, yc)
  if (result) console.log('completed')
  else console.log('failed')
}

startGame();
