function cAlert(html) {
  $(document.body).append(`<div class="modal fade" id="cAlert" tabindex="-1">
    <div class="modal-dialog"><div class="modal-content">
    <div class="modal-body" style="text-align:center">${html}</div>
    <div class="modal-footer">
    <button type="button" class="btn btn-secondary" data-dismiss="modal">Confirm</button>
    </div></div></div></div>`);
  $("#cAlert").modal("show").on("shown.bs.modal", function () {
    $("#cAlert .btn-secondary").trigger("focus");
  });
  return new Promise(function (resolve, reject) {
    $("#cAlert").on("hidden.bs.modal", function () {
      $("#cAlert").remove();
      resolve();
    });
  });
}
function pos(x, y) {
  return `top: ${Number(x) * 50}px; left: ${Number(y) * 50}px; `;
}
function posObj(x, y) {
  return { top: `${Number(x) * 50}px`, left: `${Number(y) * 50}px` };
}

var n = 9; // Board size
var board = [];
// board format: [([team, level, [0, 0], blood, attack] | -1)]
var nam = ["姚", "姚", "华", "华", "马", "马", "猴", "猴", "王", "贾", "贾", "贾"];
var initPos = [[0, 0], [0, 8], [0, 1], [0, 7], [1, 0], [1, 8], [1, 2], [1, 6], [0, 4], [0, 3], [0, 5], [1, 4]];
var initBlood = 10, initAttack = 1;

var player = 0;
var going = 0;
var killedi = 0, killedii = 0;
var turn = 0; // number of goes made up to now
var reviveList = []; // List of pieces waiting to be revived. Format: [[Board-like piece info], time]

function inBoard(x, y) {
  return (x >= 0 && x < n && y >= 0 && y < n);
}
function $cell(x, y) {
  return $("#board>tr").eq(x).children("td").eq(y);
}
function $piece(x, y) {
  return $(`#piece${board[x][y][0] * 16 + board[x][y][1]}`);
}

window.onload = function () {
  let ht = "";
  for (let i = 0; i < n; i++) {
    ht += "<tr>";
    for (let i = 0; i < n; i++) ht += '<td></td>';
    ht += "</tr>";
  }
  $("#board").html(ht);
  for (var i = 3; i <= 5; i++)
    for (var j = 3; j <= 5; j++) {
      $cell(i, j).css("border", "3px solid #b1a");
    }

  for (var i = 0; i < n; i++) {
    board.push([]);
    for (var j = 0; j < n; j++)
      board[i].push(-1);
  }

  for (let i = 0; i < 12; i++) {
    let xI = n - 1 - initPos[i][0], yI = n - 1 - initPos[i][1];
    let nameI = nam[i];
    document.body.innerHTML += `<div class="piece teami" id="piece${i}"
      style="${pos(xI, yI)}" onclick="control(${xI}, ${yI})"
      onmouseover="infoBox(${xI}, ${yI})"
      onmouseout="clearInfoBox()">${nameI}</div>`;
    board[xI][yI] = [0, i, [0, 0], (i == 8 ? 4 : initBlood), initAttack];
  }
  for (let i = 0; i < 12; i++) {
    let xI = initPos[i][0], yI = initPos[i][1];
    let nameI = nam[i];
    document.body.innerHTML += `<div class="piece teamii" id="piece${String(Number(i) + 16)}"
      style="${pos(xI, yI)}" onclick="control(${xI}, ${yI})"
      onmouseover="infoBox(${xI}, ${yI})"
      onmouseout="clearInfoBox()">${nameI}</div>`;
    board[xI][yI] = [1, i, [0, 0], (i == 8 ? 4 : initBlood), initAttack];
  }
}

function infoBox(x, y) {
  $("#blood").empty();
  $("#bone").empty();
  let boardXY = board[x][y];
  document.getElementById("control-name").innerHTML = nam[boardXY[1]];
  document.getElementById("control").style.left = String(8 + (Number(y) + 1) * 51) + "px";
  document.getElementById("control").style.top = String(8 + (Number(x) + 1) * 51) + "px";
  for (let i = 1; i * 2 <= boardXY[3]; i++)
    $("#blood").append(`<img src="img/heart.png" style="width: 20px">`);
  if (boardXY[3] % 2)
    $("#blood").append(`<img src="img/heart-half.png" style="width: 20px">`);
  for (let i = 1; i * 2 <= boardXY[4]; i++)
    $("#bone").append(`<img src="img/heart.png" style="width: 20px">`);
  if (boardXY[4] % 2)
    $("#bone").append(`<img src="img/heart-half.png" style="width: 20px">`);
  if (boardXY[1] == 8) $("#attack").css("display", "none");
  else $("#attack").css("display", "block");
  $("#control").show();
}
function clearInfoBox() {
  $("#control").hide();
}

function control(x, y) {
  function controlHelper(x, y, nx, ny, player) {
    if (!inBoard(nx, ny)) return;
    if (board[nx][ny][0] == player) return;
    if (board[nx][ny] == -1)
      $("#go").append(`<div class="go-empty" onclick="go(${x},${y},${nx},${ny})"
        style="${pos(nx, ny)}"></div>`);
    else if (board[nx][ny][0] != player) {
      $("#go").append(`<div class="go-kill" onclick="go(${x},${y},${nx},${ny})"
        style="${pos(nx, ny)}"></div>`);
    }
  }

  let boardXY = board[x][y];
  if (player == boardXY[0] && going == 0) {
    going = 2;
    // Compute where the piece can go and store the destinations in `res`
    var res = [];
    switch (boardXY[1]) {
      case 0:
      case 1:
        var dx = [-1, 0, 1, 0], dy = [0, -1, 0, 1];
        for (let d = 0; d < 4; d++) {
          let nx = Number(x) + Number(dx[d]), ny = Number(y) + Number(dy[d]);
          while (inBoard(nx, ny) && board[nx][ny] == -1) {
            res.push([nx, ny]);
            nx += dx[d], ny += dy[d];
          }
          if (inBoard(nx, ny) && (board[nx][ny] == -1 || board[nx][ny][0] != player))
            res.push([nx, ny]);
        }
        break;
      case 2:
      case 3:
        var dx = [-1, -1, 1, 1], dy = [-1, 1, -1, 1];
        for (let d = 0; d < 4; d++) {
          let nx = Number(x) + Number(dx[d]), ny = Number(y) + Number(dy[d]);
          while (inBoard(nx, ny) && board[nx][ny] == -1) {
            res.push([nx, ny]);
            nx += dx[d], ny += dy[d];
          }
          if (inBoard(nx, ny) && (board[nx][ny] == -1 || board[nx][ny][0] != player))
            res.push([nx, ny]);
        }
        dx = [1, -1, 0, 0], dy = [0, 0, 1, -1];
        for (let d = 0; d < 4; d++) {
          let nx = Number(x) + dx[d], ny = Number(y) + dy[d];
          if (inBoard(nx, ny) && (board[nx][ny] == -1 || board[nx][ny][0] != player))
            res.push([nx, ny]);
        }
        break;
      case 4:
      case 5:
        var dx = [1, -1, 1, -1, 2, -2, 2, -2], dy = [2, 2, -2, -2, 1, 1, -1, -1];
        for (let d = 0; d < 8; d++) {
          let nx = Number(x) + Number(dx[d]), ny = Number(y) + Number(dy[d]);
          if (inBoard(nx, ny) && (board[nx][ny] == -1 || board[nx][ny][0] != player))
            res.push([nx, ny]);
        }
        break;
      case 6:
      case 7:
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          if (Math.abs(i - x) + Math.abs(j - y) <= 2 && // Manhattan distance <= 2
            inBoard(i, j) && (board[i][j] == -1 || board[i][j][0] != player))
            res.push([i, j]);
        }
        break;
      case 9:
      case 10:
      case 11:
        var dx = [1, -1, 0, 0], dy = [0, 0, 1, -1];
        for (let d = 0; d < 4; d++) {
          let nx = Number(x) + dx[d], ny = Number(y) + dy[d];
          if (inBoard(nx, ny) && (board[nx][ny] == -1 || board[nx][ny][0] != player))
            res.push([nx, ny]);
        }
        break;
    }
    // Render the clickable green(or other colors) squares
    for (var point of res) controlHelper(x, y, point[0], point[1], player);
  }
  if (going == 1) {
    $("#go").empty();
    going = 0;
  }
  if (going == 2) going = 1;
}

// The 3 functions below are just for displaying.
// They don't change the value of `board`, so you should change it manually.
// Just to move a piece without considering anything else
function movePiece(x, y, nx, ny) {
  var bxy = board[x][y];
  var ele = document.getElementById("piece" + String(Number(bxy[0]) * 16 + Number(bxy[1])));
  ele.onclick = function () {
    control(nx, ny);
  };
  ele.onmouseover = function () {
    infoBox(nx, ny);
  };
  $(ele).css(posObj(nx, ny));
}
// Display a piece as dead (put it out of the board)
var killPiecePos = 0;
function killPiece(x, y) {
  var bxy = board[x][y];
  var ele = document.getElementById("piece" + String(Number(bxy[0]) * 16 + Number(bxy[1])));
  $(ele).css(posObj((killPiecePos++) % n, n + 1))
  ele.onclick = function () { };
  ele.onmouseover = function () { };
  ele.style.backgroundImage = "none";
  reviveList.push([bxy, 5]); // `5` means reviving after 5 goes
}
// Display a piece as alive (put it back in the board)
function revivePiece(i, nx, ny) {
  // if (bxy[0] == 0) killedi--;
  // else killedii--;
  var bxy = reviveList[i][0];
  var ele = document.getElementById("piece" + String(Number(bxy[0]) * 16 + Number(bxy[1])));
  $(ele).css(posObj(nx, ny));
  ele.onclick = function () {
    control(nx, ny);
  };
  ele.onmouseover = function () {
    infoBox(nx, ny);
  }
  reviveList.splice(i, 1);
}

// Main function triggered when player wants to move a piece
function go(x, y, nx, ny) {
  let bxy = board[x][y], nbxy = board[nx][ny];
  $("#go").empty();
  $("#control").fadeOut();
  going = 0;
  player = 1 - player;
  if (player == 0) document.getElementById("player").style.background = "red";
  else document.getElementById("player").style.background = "blue";
  if (nbxy == -1) { // Steps into empty square
    movePiece(x, y, nx, ny);
    board[x][y] = -1;
    board[nx][ny] = bxy;
  }
  else { // Attack another piece
    board[nx][ny][3] -= board[x][y][4];
    nbxy = board[nx][ny]; bxy = board[x][y];
    if (nbxy[3] <= 0) { // Knock Out
      var winFlag = (nbxy[1] == 8 ? nbxy[0] : -1);
      killPiece(nx, ny);
      bxy[4] = Math.max(bxy[4], nbxy[4]), nbxy[4] = 0; // Transfer bones
      if (bxy[4] >= 2)
        $piece(x, y).css("background-image", `url(img/piece${bxy[4]}.png)`);
      movePiece(x, y, nx, ny);
      board[x][y] = -1; board[nx][ny] = bxy;
      if (winFlag == 0) cAlert("<h2>Blue wins!</h2>");
      if (winFlag == 1) cAlert("<h2>Red wins!</h2>");
    }
    else if (board[nx][ny][1] != 8) { // Still alive; Knockback; 王 cannot be knocked back
      var kb = [0, 0];
      var sign = (x) => (x > 0 ? 1 : (x == 0 ? 0 : -1));
      kb[0] = sign(nx - x), kb[1] = sign(ny - y);
      var kbnx = nx + kb[0], kbny = ny + kb[1];
      if (inBoard(kbnx, kbny) && board[kbnx][kbny] == -1) {
        movePiece(nx, ny, kbnx, kbny);
        board[kbnx][kbny] = board[nx][ny], board[nx][ny] = -1;
      }
    }
  }

  // Process bone production
  turn++;
  $("#raise").html(5 - turn % 5);
  if (turn % 5 == 0) {
    for (var i = 3; i <= 5; i++)
      for (var j = 3; j <= 5; j++) {
        if (board[i][j] != -1 && board[i][j][4] < 4) {
          board[i][j][4]++;
          $piece(i, j).css("background-image", `url(img/piece${board[i][j][4]}.png)`);
        }
        $cell(i, j).css("border", "3px solid #f2e");
      }
  }
  else for (var i = 3; i <= 5; i++)
    for (var j = 3; j <= 5; j++) {
      $cell(i, j).css("border", "3px solid #b1a");
    }

  // Revive pieces
  for (var i in reviveList) {
    var item = reviveList[i];
    item[1]--;
    if (item[1] == 0) {
      var rx, ry;
      if (item[0][0] == 0) {
        rx = n - 1, ry = n - 1;
        while (board[rx][ry] != -1) {
          ry--;
          if (ry == -1) ry = n - 1, rx--;
        }
      }
      else {
        rx = 0, ry = 0;
        while (board[rx][ry] != -1) {
          ry++;
          if (ry == n) ry = 0, rx++;
        }
      }
      board[rx][ry] = [item[0][0], item[0][1], [0, 0], initBlood, initAttack];
      revivePiece(i, rx, ry);
    }
  }
}

function giveUp() {
  if (player == 0) {
    cAlert("<h2>Blue Wins!</h2>");
  }
  else {
    cAlert("<h2>Red Wins!</h2>");
  }
}