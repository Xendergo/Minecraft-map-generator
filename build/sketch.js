"use strict";
const imageC = document.getElementById("image");
const imageDraw = imageC.getContext("2d");

const multipliers = [1, 220 / 255, 180 / 255];

const preC = $("#preview")[0];
const preDraw = preC.getContext("2d");

let uploaded = false;

let flammable;
let colors;
let obj;
let wasm;
fetch("./colors.json").then(async (res) => {
  let blockData = await res.json();
  flammable = blockData.flammable;
  colors = blockData.colors;

  const keys = Object.keys(colors);

  const colorsShown = $("#colorsShown");
  for (let i = 0; i < keys.length; i++) {
    const selector = $(`<select id="${i}" style="height:2vh; margin: 0.25vh" onchange="updateColors(${i})"></select>`);

    const color = keys[i].split(", ");
    const c1 = `rgb(${color[0]*multipliers[0]}, ${color[1]*multipliers[0]}, ${color[2]*multipliers[0]})`;
    const c2 = `rgb(${color[0]*multipliers[1]}, ${color[1]*multipliers[1]}, ${color[2]*multipliers[1]})`;
    const c3 = `rgb(${color[0]*multipliers[2]}, ${color[1]*multipliers[2]}, ${color[2]*multipliers[2]})`;
    const colorElem = $(`<div style="height:2.5vh; width:10vw; background: linear-gradient(to right, ${c1} 33%, ${c2} 33%, ${c2} 67%, ${c3} 67%);"></div>`);
    colorElem.appendTo(colorsShown);

    for (let j = 0; j < colors[keys[i]].length; j++) {
      const option = $(`<option value="${colors[keys[i]][j]}" ${j === 0 ? "selected" : ""}>${colors[keys[i]][j].replaceAll("_", " ")}</option>`);
      option.appendTo(selector);
    }
    const option = $(`<option value="none">none</option>`);
    option.appendTo(selector);

    selector.appendTo("#colors");
  }

  loader.instantiate(fetch('optimized.wasm'), importObject)
    .then((thingy) => {
      wasm = thingy.exports;

      const r = [];
      const g = [];
      const b = [];

      const keys = Object.keys(colors);
      for (let i = 0; i < keys.length; i++) {
        const color = keys[i].split(", ");
        r.push(color[0]);
        g.push(color[1]);
        b.push(color[2]);
      }

      for (let i = 0; i < 3; i++) {
        const mult = multipliers[i];
        const rPtr = wasm.__retain(wasm.__newArray(wasm.Array16Id, r.map(v => v * mult)));
        const gPtr = wasm.__retain(wasm.__newArray(wasm.Array16Id, g.map(v => v * mult)));
        const bPtr = wasm.__retain(wasm.__newArray(wasm.Array16Id, b.map(v => v * mult)));
        wasm.getColorData(rPtr, gPtr, bPtr, i);
        wasm.__release(rPtr);
        wasm.__release(gPtr);
        wasm.__release(bPtr);
      }

      wasm.getFlammable(wasm.__retain(wasm.__newArray(wasm.stringArrayId, flammable.map(v => wasm.__newString("minecraft:" + v)))));

      updateDithering($("#dithering")[0].checked);
      updateHeight($("#height").val());
      updateStepMode($("#step").val());
      updateWidth($("#width").val());
      protectFlammable($("#protect")[0].checked);
    });
});

var importObject = {
  env: {
    memory: new WebAssembly.Memory({
      initial: 256
    }),
    abort(msgPtr, filePtr, line, column) {
      throw new Error(`${wasm.__getString(filePtr)}: abort at [${ line }:${ column }], ${wasm.__getString(msgPtr)}`);
    }
  },
  index: {
    print: (value1) => console.log(value1),
    printStr: (valuePtr) => {
      console.log(wasm.__getString(valuePtr));
      wasm.__release(valuePtr);
    },
    printStrArray: (valuePtr) => {
      console.log(wasm.__getArray(valuePtr).map(v => wasm.__getString(v)));
    },
    stringToUtf8: (stringPtr) => {
      const v = wasm.__getString(stringPtr);
      wasm.__release(stringPtr);
      const arrPtr = wasm.__retain(wasm.__newArray(wasm.Array8Id, unicodeStringToTypedArray(v)));
      return arrPtr;
    }
  },
  Date
};

function upload() {
  if (!this.files || !this.files[0]) return;
  document.getElementById("file").hidden = true;
  const FR = new FileReader();
  FR.addEventListener("load", (e) => {
    const img = new Image();
    img.addEventListener("load", () => {
      imageC.width = img.width;
      imageC.height = img.height;
      imageDraw.clearRect(0, 0, imageC.width, imageC.height);
      imageDraw.drawImage(img, 0, 0);

      const imageData = imageDraw.getImageData(0, 0, imageC.width, imageC.height);
      const pixelsPtr = wasm.__retain(wasm.__newArray(wasm.Array8Id, imageData.data));
      wasm.getImgData(imageData.width, imageData.height, pixelsPtr);
      wasm.__release(pixelsPtr);

      updateScreen();

      uploaded = true;
    });
    img.src = e.target.result;
  });
  FR.readAsDataURL(this.files[0]);
}

function updateColors(i) {
  wasm.enableColor(i, $(`#${i}`).val() !== "none");
}

function updateStepMode(value) {
  wasm.changeStep(value === "step");
}

function updateDithering(value) {
  wasm.changeDithering(value);
}

function updateWidth(value) {
  wasm.changeWidth(value);
  preC.width = value * 128;
}

function updateHeight(value) {
  wasm.changeHeight(value);
  preC.height = value * 128;
}

function protectFlammable(value) {
  wasm.protectFlammable(value);
}

function downloadSchematic() {
  if (uploaded) {
    // Get the list of blocks to use for each color
    const len = Object.keys(colors).length;
    const blocks = [];
    for (let i = 0; i < len; i++) {
      blocks.push(wasm.__retain(wasm.__newString("minecraft:" + $(`#${i}`).val())));
    }

    // Send the list and get the litematic file
    const blocksPtr = wasm.__retain(wasm.__newArray(wasm.stringArrayId, blocks));
    const arrayPtr = wasm.compile(blocksPtr);
    blocks.forEach(wasm.__release);
    // wasm.__release(blocksPtr);

    console.log("Downloading NBT data...");
    // Gzip & download the thingy
    window.open(URL.createObjectURL(new File([pako.gzip(wasm.__getUint8ClampedArray(arrayPtr)).buffer], "map.litematic", {
      type: "application/octet-stream"
    })), "_self");
    wasm.__release(arrayPtr);
  }
}

async function updateScreen() {
  if (uploaded) {
    wasm.rerender();

    // wacky pointer stuff    https://www.assemblyscript.org/loader.html#reading-arrays
    const rPtr = wasm.getRedChannel();
    const gPtr = wasm.getGreenChannel();
    const bPtr = wasm.getBlueChannel();
    const r = wasm.__getArray(rPtr);
    const g = wasm.__getArray(gPtr);
    const b = wasm.__getArray(bPtr);
    wasm.__release(r);
    wasm.__release(g);
    wasm.__release(b);

    const imageData = preDraw.getImageData(0, 0, preC.width, preC.height);
    const pixels = imageData.data;

    for (let i = pixels.length - 4; i >= 0; i -= 4) {
      let j = i / 4;
      pixels[i + 0] = r[j];
      pixels[i + 1] = g[j];
      pixels[i + 2] = b[j];
      pixels[i + 3] = 255;
    }

    preDraw.putImageData(imageData, 0, 0);
  }
}

// https://coolaj86.com/articles/unicode-string-to-a-utf-8-typed-array-buffer-in-javascript/
function unicodeStringToTypedArray(s) {
  var escstr = encodeURIComponent(s);
  var binstr = escstr.replace(/%([0-9A-F]{2})/g, function (match, p1) {
    return String.fromCharCode('0x' + p1);
  });
  var ua = new Array(binstr.length);
  Array.prototype.forEach.call(binstr, function (ch, i) {
    ua[i] = ch.charCodeAt(0);
  });
  return ua;
}

document.getElementById("file").addEventListener("change", upload);