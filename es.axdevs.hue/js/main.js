const BET_COLORS = 10;
const MAX_HEIGHT = 1200 / (BET_COLORS+2);
const componentToHex = (c) => {
  const value = Math.round(c);
  const hex = value.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

const rgbToHex = (r, g, b) => {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function hexToRgb(hex) {
var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
return result ? {
  r: parseInt(result[1], 16),
  g: parseInt(result[2], 16),
  b: parseInt(result[3], 16),
  rgb: `rgb(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)})`
} : null;
}

//gets contrast
const RED = 0.2126;
const GREEN = 0.7152;
const BLUE = 0.0722;

const GAMMA = 2.4;

function luminance(r, g, b) {
var a = [r, g, b].map((v) => {
  v /= 255;
  return v <= 0.03928
    ? v / 12.92
    : Math.pow((v + 0.055) / 1.055, GAMMA);
});
return a[0] * RED + a[1] * GREEN + a[2] * BLUE;
}

function contrast(rgb1) {
var lum1 = luminance(...rgb1);
var lum2 = luminance(0,0,0);
var brightest = Math.max(lum1, lum2);
var darkest = Math.min(lum1, lum2);
return (brightest + 0.05) / (darkest + 0.05);
}

//color object
function Color() {
  const obj = {};
  function hexConstructor(hex, index = null) {
    obj.hex = hex;
    obj.id = crypto.randomUUID();
    var aux = hexToRgb(obj.hex);
    obj.r = aux.r;
    obj.g = aux.g;
    obj.b = aux.b;
    obj.rgb = aux.rgb;
    obj.index = index;
    obj.width = 100/(BET_COLORS+2);
    obj.height = MAX_HEIGHT;
    obj.contrast = contrast([obj.r,obj.g,obj.b]) >= 4.5 ? 'black' : 'white';
    return obj;
  }
  function rgbConstructor(r,g,b, index = null) {
    obj.r = r;
    obj.g = g;
    obj.b = b;
    obj.id = crypto.randomUUID();
    obj.rgb = `rgb(${obj.r},${obj.g},${obj.b})`;
    obj.hex = rgbToHex(obj.r,obj.g,obj.b);
    obj.index = index;
    obj.width = 100/(BET_COLORS+2);
    obj.height = MAX_HEIGHT;
    obj.contrast = contrast([obj.r,obj.g,obj.b]) >= 4.5 ? 'black' : 'white';
    return obj; // commented out because this happens automatically
  }

  switch (arguments.length) {
      case 2 :
          return hexConstructor(arguments[0], arguments[1]);
      case 4 :
          return rgbConstructor(arguments[0], arguments[1], arguments[2], arguments[3]);
  }
}

let colorArray = [
  new Color(225, 251, 212,0),
  new Color(198, 154, 75,1),
  new Color(41, 214, 171,2),
  new Color(92, 39, 75,3),
];
let solution;
let shuffleList;
const mix = (c1, c2) => Math.round((c1 + c2) / (BET_COLORS + 1));
const averageColor = (color1, color2) => { return new Color(mix(color1.r, color2.r),mix(color1.g, color2.g), mix(color1.b, color2.b), null); };

const A = colorArray[0]; // top-left
const B = colorArray[1]; // top-right
const C = colorArray[2]; // bottom-left
const D = colorArray[3]; // bottom-right
const mixPercent = (c1, c2, t) => { return new Color(Math.round(c1.r + (c2.r - c1.r) * t), Math.round(c1.g + (c2.g - c1.g) * t), Math.round(c1.b + (c2.b - c1.b) * t), null); };

function bilerp(A, B, C, D, x, y) { const AB = mixPercent(A, B, x); const CD = mixPercent(C, D, x); return mixPercent(AB, CD, y); }

//get color name
const userAction = async (hexCodes, result) => {
const response = await fetch(`https://api.color.pizza/v1/?values=${hexCodes}`);
const myJson = await response.json(); //extract JSON from the http response
console.log(myJson);

var newArray3 = {};
myJson.colors.forEach((element) => {
  console.log(element)
  var key = element.requestedHex;
  var obj = {};

  newArray3[key] = element.name;
});
for(let i = 0; i < result.length; i++) {
  result[i].name = newArray3[result[i].hex];
}
// do something with myJson
}


//generates gris
function generateGrid(colors, steps) { 
const [A, B, C, D] = colors; 
const result = []; 
const size = steps + 2;
let colorHex = '';
for (let row = 0; row < size; row++) { 
  const y = row / (size - 1); 
  for (let col = 0; col < size; col++) { 
    const x = col / (size - 1); 
    if (row === 0 && col === 0) { result.push(A); colorHex = `${colorHex},${A.hex.replace('#','')}`;continue; } 
    if (row === 0 && col === size - 1) { result.push(B); colorHex = `${colorHex},${B.hex.replace('#','')}`;continue; } 
    if (row === size - 1 && col === 0) { result.push(C); colorHex = `${colorHex},${C.hex.replace('#','')}`;continue; } 
    if (row === size - 1 && col === size - 1) { result.push(D); colorHex = `${colorHex},${D.hex.replace('#','')}`;continue; }
    var aux = bilerp(A, B, C, D, x, y);
    colorHex = `${colorHex},${aux.hex.replace('#','')}`;
    result.push(aux); 
  } 
}
// userAction(colorHex, result);
return result; 
}

//shuffles list but corners
function shuffle(array) { 
const corners = array.filter(p => p.index !== null); 
const normals = array.filter(p => p.index === null); 
const shuffledNormals = normals
  .map(v => ({ v, sort: Math.random() }))
  .sort((a, b) => a.sort - b.sort)
  .map(({ v }) => v);
const result = [];
let normalIndex = 0;

for (let i = 0; i < array.length; i++) {
  if (array[i].index !== null) {
    result.push(array[i]);
  } else {
    result.push(shuffledNormals[normalIndex++]);
  }
}

return result;
}

//generates colors
async function getColorData () {
const ordered = generateGrid(colorArray, BET_COLORS); 
solution = ordered;
const hexCodes = ordered.map(c => c.hex.replace('#', '')).join(',');
await userAction(hexCodes, ordered);
const colors = shuffle([...ordered]); // copia desordenada 
shuffleList = colors;
return { ordered, colors };
}

//renders template
// var colorInfo = document.getElementById('test').innerHTML;
// var template = Handlebars.compile(colorInfo);
// var colorData = template(getColorData(colorArray))

// document.getElementById('colorData').innerHTML += colorData;

(async () => {
const colorInfo = document.getElementById('test').innerHTML;
const template = Handlebars.compile(colorInfo);

const data = await getColorData(colorArray); // ← ahora espera
const html = template(data);

document.getElementById('colorData').innerHTML = html;
})();



//show input
function toggleInput(){
   if(event.target.tagName == 'DIV') {
 var status = event.target.getElementsByTagName('input')[0].style.display;
  if(status == 'none'){
    event.target.getElementsByTagName('input')[0].style.display = 'block';
    event.target.querySelector('span[name=colorCodeHex]').style.display = 'none';
   }
   else{
    event.target.getElementsByTagName('input')[0].style.display = 'none';
    event.target.querySelector('span[name=colorCodeHex]').style.display = 'block';
   }
 } else if(event.target.tagName == 'SPAN' && event.target.getAttribute('name') == 'colorCodeHex') {
 var status = event.target.parentNode.getElementsByTagName('input')[0].style.display;
    if(status == 'none'){
      event.target.parentNode.getElementsByTagName('input')[0].style.display = 'block';
      event.target.style.display = 'none';
     }
     else{
      event.target.parentNode.getElementsByTagName('input')[0].style.display = 'none';
      event.target.style.display = 'block';
     }
    }  
}

//submit color change
function changeColor() {
  event.preventDefault();
  event.target.parentNode.style.backgroundColor = event.target.getElementsByTagName('input')[0].value;
  event.target.parentNode.querySelector('span[name=colorCodeHex]').innerHTML = event.target.getElementsByTagName('input')[0].value;
  colorArray[event.target.getElementsByTagName('input')[0].getAttribute('index')] = new Color(event.target.getElementsByTagName('input')[0].value, event.target.getElementsByTagName('input')[0].getAttribute('index'));
  event.target.parentNode.querySelector('span[name=colorCodeHex]').style.display = 'block';
  event.target.getElementsByTagName('input')[0].style.display = 'none';
  
  var colorData = template(getColorData(colorArray))
  document.getElementById('colorData').innerHTML = colorData;
}

// DRAG AND DROP
const puzzle = document.getElementById("colorData");
let dragged = null; 
document.addEventListener("dragstart", e => { 
  // e.preventDefault(); 
  if (e.target.classList.contains("color")) { 
    dragged = e.target; 
    e.dataTransfer.effectAllowed = "move";
  }
}); 

let booleanTest = false;

document.addEventListener("dragend", e => { 
  e.preventDefault();
  if (booleanTest) {
    alert("¡Puzzle resuelto!"); 
  }
});

puzzle.addEventListener("dragover", e => { 
  e.preventDefault();
});

puzzle.addEventListener("drop", e => {
  e.preventDefault();
  const target = e.target.closest(".color"); 
  if (!target || target === dragged) 
    return; 
  const parent = puzzle; 
  const draggedNext = dragged.nextSibling; 
  const targetNext = target.nextSibling; // Intercambio real 
  if (draggedNext === target) { 
    parent.insertBefore(target, dragged); 
  } else if (targetNext === dragged) { 
    parent.insertBefore(dragged, target); 
  } else { 
    parent.insertBefore(dragged, targetNext); 
    parent.insertBefore(target, draggedNext); 
  }
  checkPuzzleSolved()
});


// checks solution
function checkPuzzleSolved() { 
  const parent = document.getElementById("colorData"); 
  const pieces = [...parent.children]; 
  const correct = pieces.every((piece, i) => { 
    const id = piece.id; 
    return id === solution[i].id; 
  }); 
  if (correct) { 
    booleanTest = true;
  } 
}
