// Sudoku Solver, resolution based on backtracking approach

const num_set = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // Only numbers from 1-9 are accepted as input into each of the sudoku units
var nums = {}; // Obj will contain position:value pair to keep track of the solution progress
var sud_cont = document.getElementById("sudoku-container");
// Show warning message: there is input conflict
function show_message(message, err_input) {
  var existing_err_el = document.querySelector(".err-msg");
  if (existing_err_el) existing_err_el.remove();

  var err_input_pos = Number(err_input.id.substring(1));

  var msg_el = document.createElement("DIV");
  var attr = document.createAttribute("class");
  attr.value = "err-msg";
  msg_el.setAttributeNode(attr);
  sud_cont.appendChild(msg_el);

  for (let i = 0; i < message.length; i++) {
    let paragraph = document.createElement("P");
    let textNode = document.createTextNode(message[i]);
    paragraph.appendChild(textNode);
    msg_el.appendChild(paragraph);
  }

  var game_width = sud_cont.offsetWidth;
  var game_height = sud_cont.offsetHeight;
  var msg_el_width = msg_el.offsetWidth;
  var msg_el_height = msg_el.offsetHeight;
  var posX = (100 * 0.5 * (game_width - msg_el_width)) / game_width; // in percentage
  var posY =
    err_input_pos < 36
      ? (100 * (Math.floor(err_input_pos / 9) + 1)) / 9
      : (100 *
          ((Math.floor(err_input_pos / 9) / 9) * game_height - msg_el_height)) /
        game_height; // in percentage
  msg_el.style.top = posY + "%";
  msg_el.style.left = posX + "%";

  err_input.onblur = function () {
    if (msg_el) msg_el.remove();
  };

  setTimeout(function () {
    if (msg_el) msg_el.remove();
  }, 4000);
}
// Check validity of the user input: Only numbers from 1 to 9 are accepted. If necessary, show warning message -> show_message(params)
function fix_num(input_el) {
  var input_value = input_el.value ? input_el.value : NaN;
  var input_idx = Number(input_el.id.substring(1));
  nums[input_idx] = input_value;
  var validity_result = get_num_opts(input_idx, "check validity"); // Compare input value in region, row and column; get conflict area/s
  let prev_classes = document.getElementById("u" + input_idx).attributes[3].value;
  // In case it exists, strip of "solved" class the corresponding sudoku unit
  document.getElementById("u" + input_idx).attributes[3].value = prev_classes.replace(
      " solved",
      ""
    );

  if (num_set.indexOf(Number(input_value)) < 0 && input_value) { 
    input_el.value = "";
    input_el.focus();
    nums[input_idx] = "";
    show_message(["only numbers from 1 to 9 are accepted"], input_el);
  } else if (validity_result.length > 0) {
    nums[input_idx] = "";
    input_el.value = "";
    input_el.focus();
    show_message(validity_result, input_el);
  } else {
    let err_msg_el = document.querySelector(".err-msg"); // In case error message still lingers, remove it
    if (err_msg_el) err_msg_el.remove();
  }
}
// Display sudoku grid layout for the user:
function make_sudoku_grid() {
  var sudoku_container = document.querySelector("#sudoku-container");

  for (let j = 0; j < 81; j++) {
    let sudoku_box = document.createElement("DIV");
    sudoku_container.appendChild(sudoku_box);
    let inputNode = document.createElement("INPUT");

    let att = document.createAttribute("maxlength");
    att.value = "1";
    inputNode.setAttributeNode(att);

    let input_id = document.createAttribute("id");
    input_id.value = "u" + j;
    inputNode.setAttributeNode(input_id);

    let input_listener = document.createAttribute("oninput");
    input_listener.value = "fix_num(this)";
    inputNode.setAttributeNode(input_listener);
    
    let attr = document.createAttribute("class");
    attr.value = "sudoku-unit";
    
    if (j % 3 === 0 && j % 9 !== 0) attr.value += " wVborder";
    if ((j - 1) % 3 === 0 || (j + 1) % 3 === 0) attr.value += " left-border";
    if (j % 27 < 9 && j > 9) attr.value += " wHborder";
    if (j < 81 - 9 && j % 27 < 27 - 9) attr.value += " bottom-border";

    inputNode.setAttributeNode(attr);
    sudoku_box.appendChild(inputNode);
  }
}
// Get num_options for the pinned unit or, on input, check validity of the value in the pinned unit
function get_num_opts(idx, str) {
  let row_start = idx - (idx % 9);
  let col_start = idx % 9;
  let region_start =
    row_start - (row_start % 27) + 3 * Math.floor(col_start / 3);

  let num_options = [];
  let err_msg = [];

  for (let j = 0; j < 9; j++) {
    let row_num =
      idx != col_start + 9 * j ? Number(nums[col_start + 9 * j]) : null;
    let col_num = idx != row_start + j ? Number(nums[row_start + j]) : null;
    let row_inc = j % 3;
    let col_inc = Math.floor(j / 3) * 9;
    let region_num =
      idx != region_start + row_inc + col_inc
        ? Number(nums[region_start + row_inc + col_inc])
        : null;

    if (str === "check validity") {
      if (row_num == Number(nums[idx])) err_msg.push("repeated number in row");
      if (col_num == Number(nums[idx]))
        err_msg.push("repeated number in column");
      if (region_num == Number(nums[idx]))
        err_msg.push("repeated number in region");
    } else {
      num_options[j + 1] = isNaN(num_options[j + 1]) ? j + 1 : null;
      if (row_num) num_options[row_num] = null;
      if (col_num) num_options[col_num] = null;
      if (region_num) num_options[region_num] = null;
    }
  }

  if (str === "get options") {
    num_options = num_options.filter(function (item, i) {
      return item;
    });

    return num_options;
  }

  return err_msg;
}
// Implement logic to solve sudoku, work with array of indexes of empty units. In first loop, find all the unique solutions for the corresponding units (dwindle the array). Afterwards, take the backtracking approach to progress through the remaining arr. When the second loop is completed (if there is a solution), populate the nums obj with numbers for corresponding keys (unresolved positions). Return the same initial arr or an error message if solution is not possible.
function do_math(arr) {
  var positions = [];
  var count = 0;

  while (arr.length > 0) {
    let i = arr[0];
    let num_opts = get_num_opts(i, "get options");

    if (count < arr.length) {
      if (nums[i]) {
        switch (num_opts.length) {
          case 0:
            arr.unshift(arr.pop(i));
            count--;
            break;
          default:
            let prev_item = Number(nums[i]);
            let idx = num_opts.indexOf(prev_item) + 1;
            let next_item = num_opts[idx];

            if (next_item) {
              nums[i] = [next_item];
              arr.push(arr.shift());
              count++;
            } else {
              if (count === 0) return "invalid input, no solution can be found";
              nums[i] = [];
              arr.unshift(arr.pop(i));
              count--;
            }
        }
      } else {
        positions.push(i);
        switch (num_opts.length) {
          case 0:
            return "invalid input, no solution can be found";
          case 1:
            nums[i] = num_opts[0];
            arr.shift();
            break;
          default:
            nums[i] = [];
            arr.push(arr.shift());
        }
      }
    } else {
      nums[i] = num_opts[0];
      arr.shift();
    }
  }
  return positions;
}
// Solve sudoku and print result
function solve_sudoku() {
  var unresolved_positions = [];

  for (let i = 0; i < 81; i++) {
    if (!nums[i]) {
      unresolved_positions.push(i);
    }
  }

  var result = do_math(unresolved_positions); 

  if (typeof result == "string") {
    let err_msg_el = document.getElementById("error-msg");
    err_msg_el.textContent = result;
  } else {
    for (let i = 0; i < result.length; i++) {
      let solved_el = document.getElementById("u" + result[i]);
      solved_el.attributes[3].value += " solved";
      solved_el.value = nums[result[i]];
    }
  }
}

function clear_up() {
  for (let i = 0; i < 81; i++) {
    nums[i] = "";
    document.getElementById("u" + i).value = "";
    let prev_classes = document.getElementById("u" + i).attributes[3].value;
    document.getElementById("u" + i).attributes[3].value = prev_classes.replace(
      " solved",
      ""
    );
  }
}

window.onload = make_sudoku_grid();