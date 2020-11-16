export declare function print(arg0: i64): void;
export declare function printStr(arg0: String): void;
export declare function printStrArray(arg0: Array<String>): void;
export declare function stringToUtf8(arg0: String): Array<u8>;

export const Array8Id = idof<Array<u8>>();
export const Uint8Id = idof<Uint8ClampedArray>();
export const Array16Id = idof<Array<i16>>();
export const stringArrayId = idof<Array<String>>();

var enabledColors: Array<bool> = new Array<bool>(58);
for (let i = enabledColors.length-1; i >= 0; i--) {
  enabledColors[i] = true;
}
var width: i32 = 1;
var height: i32 = 1;
var dithering: bool = true;
var step: bool = true;
var protect: bool = true;

var enabledColorsAmt: i32 = 58;

var rColors :Map<i32, Map<i32, i16>> = new Map<i32, Map<i32, i16>>();
var gColors :Map<i32, Map<i32, i16>> = new Map<i32, Map<i32, i16>>();
var bColors :Map<i32, Map<i32, i16>> = new Map<i32, Map<i32, i16>>();
for (let i = 0; i < 3; i++) {
  rColors.set(i, new Map<i32, i16>());
  gColors.set(i, new Map<i32, i16>());
  bColors.set(i, new Map<i32, i16>());
}

var enabledRColors :Map<i32, Map<i32, i16>> = new Map<i32, Map<i32, i16>>();
var enabledGColors :Map<i32, Map<i32, i16>> = new Map<i32, Map<i32, i16>>();
var enabledBColors :Map<i32, Map<i32, i16>> = new Map<i32, Map<i32, i16>>();
var skippedArray: Array<i32>;

var len: i32 = (width*height) << 14;
var r = new Array<u8>(len);
var g = new Array<u8>(len);
var b = new Array<u8>(len);

var imgWidth: i32;
var imgHeight: i32;
var imgR = new Array<u8>();
var imgG = new Array<u8>();
var imgB = new Array<u8>();

const multipliers = new Int32Array(3);
multipliers[0] = 255;
multipliers[1] = 220;
multipliers[2] = 180;

const ditheringAmt: Uint16Array = new Uint16Array(4);
ditheringAmt[0] = 7;
ditheringAmt[1] = 3;
ditheringAmt[2] = 5;
ditheringAmt[3] = 1;

for (var i :i32 = 0; i < len; i++) {
  r[i] = 0;
  g[i] = 0;
  b[i] = 0;
}

export function enableColor(bit: i32, value:bool) :void {
  if (enabledColors.length <= bit) {
    for (let i = enabledColors.length; i < bit + 1; i++) {
      enabledColors[i] = false;
    }
  }

  enabledColors[bit] = value;
}

export function changeStep(useStep: bool) :void {
  step = useStep;
}

export function changeDithering(dither: bool): void {
  dithering = dither;
}

export function changeWidth(w: i32): void {
  width = w;
}

export function changeHeight(h: i32): void {
  height = h;
}

export function protectFlammable(value: bool): void {
  protect = value;
}

function getColor(r: i16, g: i16, b: i16): Int64Array {
  if (step) {
    let score: i16 = 765;
    let scoreR: i16 = 255;
    let scoreG: i16 = 255;
    let scoreB: i16 = 255;
    let index: i32 = 0;
    let stepAmt: i32 = 0;
    for (let i = enabledColorsAmt; i >= 0; i--) {
      for (let j: i32 = 0; j < 3; j++) {
        const newScoreR: i16 = r-enabledRColors.get(j).get(i);
        const newScoreG: i16 = g-enabledGColors.get(j).get(i);
        const newScoreB: i16 = b-enabledBColors.get(j).get(i);
        const newScore: i16 = abs(newScoreR)+abs(newScoreG)+abs(newScoreB);
        if (newScore < score) {
          scoreR = newScoreR;
          scoreG = newScoreG;
          scoreB = newScoreB;
          score = newScore;
          index = i;
          stepAmt = j;
        }
      }
    }

    const ret: Int64Array = new Int64Array(4);
    ret[0] = <i64>(index+skippedArray[index]) | (<i64>stepAmt << 32);
    ret[1] = <i64>scoreR;
    ret[2] = <i64>scoreG;
    ret[3] = <i64>scoreB;
    return ret;
  } else {
    let score: i16 = 765;
    let scoreR: i16 = 255;
    let scoreG: i16 = 255;
    let scoreB: i16 = 255;
    let index: i32 = 0;
    for (let i = enabledColorsAmt; i >= 0; i--) {
      const newScoreR: i16 = r-enabledRColors.get(1).get(i);
      const newScoreG: i16 = g-enabledGColors.get(1).get(i);
      const newScoreB: i16 = b-enabledBColors.get(1).get(i);
      const newScore: i16 = abs(newScoreR)+abs(newScoreG)+abs(newScoreB);

      if (newScore < score) {
        scoreR = newScoreR;
        scoreG = newScoreG;
        scoreB = newScoreB;
        score = newScore;
        index = i;
      }
    }

    const ret: Int64Array = new Int64Array(4);
    ret[0] = <i64>(index+skippedArray[index]) | (1 << 32);
    ret[1] = <i64>scoreR;
    ret[2] = <i64>scoreG;
    ret[3] = <i64>scoreB;

    return ret;
  }
}

function getColors(): Int64Array {
  let len = enabledColors.length;
  for (let i = 0; i < 3; i++) {
    enabledRColors.set(i, new Map<i32, i16>());
    enabledGColors.set(i, new Map<i32, i16>());
    enabledBColors.set(i, new Map<i32, i16>());
  }

  skippedArray = new Array<i32>();
  let skipped: i32 = 0;
  for (let i = 0; i < len; i++) {
    if (enabledColors[i]) {
      let minusS: i32 = i - skipped;
      enabledRColors.get(0).set(minusS, rColors.get(0).get(i));
      enabledRColors.get(1).set(minusS, rColors.get(1).get(i));
      enabledRColors.get(2).set(minusS, rColors.get(2).get(i));
      enabledGColors.get(0).set(minusS, gColors.get(0).get(i));
      enabledGColors.get(1).set(minusS, gColors.get(1).get(i));
      enabledGColors.get(2).set(minusS, gColors.get(2).get(i));
      enabledBColors.get(0).set(minusS, bColors.get(0).get(i));
      enabledBColors.get(1).set(minusS, bColors.get(1).get(i));
      enabledBColors.get(2).set(minusS, bColors.get(2).get(i));
      skippedArray.push(skipped);
    } else {
      skipped++;
    }
  }

  enabledColorsAmt = enabledRColors.get(0).size-1;

  len = (width*height) << 14;
  let tempR :Uint8ClampedArray = new Uint8ClampedArray(len);
  let tempG :Uint8ClampedArray = new Uint8ClampedArray(len);
  let tempB :Uint8ClampedArray = new Uint8ClampedArray(len);
  let ret :Int64Array = new Int64Array(len);

  const pixelsWide = width << 7;
  const pixelsTall = height << 7;
  for (let i :i32 = 0; i < len; i++) {
    const j = remap(i/pixelsWide, 0, pixelsTall, 0, imgHeight)*imgWidth+remap(i%pixelsWide, 0, pixelsWide, 0, imgWidth);
    tempR[i] = imgR[j];
    tempG[i] = imgG[j];
    tempB[i] = imgB[j];
  }

  if (dithering) {
    for (let i :i32 = 0; i < len; i++) {
      const index: Int64Array = getColor(tempR[i], tempG[i], tempB[i]);
      ret[i] = index[0];

      // Floyd steinberg dithering
      let i1: i32 = i+1;
      let i3: i32 = i+pixelsWide;
      let i2: i32 = i3-1;
      let i4: i32 = i3+1;

      if (i1 < len) {
        tempR[i1] = clamp((<i64>tempR[i1])+index[1]*ditheringAmt[0]/16);
        tempG[i1] = clamp((<i64>tempG[i1])+index[2]*ditheringAmt[0]/16);
        tempB[i1] = clamp((<i64>tempB[i1])+index[3]*ditheringAmt[0]/16);
      }

      if (i2 < len) {
        tempR[i2] = clamp((<i64>tempR[i2])+index[1]*ditheringAmt[1]/16);
        tempG[i2] = clamp((<i64>tempG[i2])+index[2]*ditheringAmt[1]/16);
        tempB[i2] = clamp((<i64>tempB[i2])+index[3]*ditheringAmt[1]/16);
      }

      if (i3 < len) {
        tempR[i3] = clamp((<i64>tempR[i3])+index[1]*ditheringAmt[2]/16);
        tempG[i3] = clamp((<i64>tempG[i3])+index[2]*ditheringAmt[2]/16);
        tempB[i3] = clamp((<i64>tempB[i3])+index[3]*ditheringAmt[2]/16);
      }

      if (i4 < len) {
        tempR[i4] = clamp((<i64>tempR[i4])+index[1]*ditheringAmt[3]/16);
        tempG[i4] = clamp((<i64>tempG[i4])+index[2]*ditheringAmt[3]/16);
        tempB[i4] = clamp((<i64>tempB[i4])+index[3]*ditheringAmt[3]/16);
      }
    }
  } else {
    for (let i :i32 = 0; i < len; i++) {
      const index: Int64Array = getColor(tempR[i], tempG[i], tempB[i]);
      ret[i] = index[0];
    }
  }

  return ret;
}

export function rerender() :void {
  const indexes = getColors();

  for (let i = indexes.length-1; i >= 0; i--) {
    const mult = <i32>(indexes[i] >>> 32);
    const cIndex = <i32>(indexes[i] & 4294967295);
    r[i] = <u8>rColors.get(mult).get(cIndex);
    g[i] = <u8>gColors.get(mult).get(cIndex);
    b[i] = <u8>bColors.get(mult).get(cIndex);
  }
}

export function getRedChannel() :Array<u8> {
  return r;
}

export function getGreenChannel() :Array<u8> {
  return g;
}

export function getBlueChannel() :Array<u8> {
  return b;
}

export function getColorData(red :Array<i16>, green :Array<i16>, blue :Array<i16>, mult: i32) :void {
  const len = red.length;
  for (let i = 0; i < len; i++) {
    rColors.get(mult).set(i, red[i]);
    gColors.get(mult).set(i, green[i]);
    bColors.get(mult).set(i, blue[i]);
  }
}

export function getImgData(width: i32, height: i32, imgData: Array<u8>): void {
  imgWidth = width;
  imgHeight = height;
  for (let i = imgData.length-4; i >= 0; i-=4) {
    const alpha = imgData[i+3];
    imgR.push(<u8>remap(imgData[i+0], 0, 255, 0, alpha));
    imgG.push(<u8>remap(imgData[i+1], 0, 255, 0, alpha));
    imgB.push(<u8>remap(imgData[i+2], 0, 255, 0, alpha));
  }
  imgR = imgR.reverse();
  imgG = imgG.reverse();
  imgB = imgB.reverse();
}

function remap(value: i32, low1: i32, high1: i32, low2: i32, high2: i32): i32 {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function clamp(v: i64): u8 {
  return <u8>(min(max(v, 0), 255));
}

export function compile(blocks: Array<String>): Uint8ClampedArray {
  printStr("Getting color data...");
  const indexes = getColors();
  
  printStr("Converting to map data...");
  const mapW = width << 7; // *128
  const mapH = height << 7;
  
  const mapBlocks: Array<Array<i32>> = new Array<Array<i32>>(mapW*height);
  let len = mapW*height;
  for (let i = 0; i < len; i++) {
    mapBlocks[i] = new Array<i32>(129);
    mapBlocks[i].fill(0);
  }
  const mapOffsets: Array<Array<i16>> = new Array<Array<i16>>(mapW*height);
  for (let i = 0; i < len; i++) {
    mapOffsets[i] = new Array<i16>(129);
    mapOffsets[i].fill(0);
  }
  const offset = mapW*height;

  len = indexes.length;
  for (let i: i32 = 0; i < len; i++) {
    // Put 128x128 squares on a single line
    const row = (i / mapW) >> 7;
    const x = (i % mapW) + row * mapW;
    const y = (i / mapW) & 0b1111111;
    mapBlocks[x][y+1] = <i32>(indexes[i] & 4294967295);
    mapOffsets[x][y+1] = <i16>((indexes[i] >>> 32)-1);
  }

  let max: i16 = 0;
  for (let i = 0; i < offset; i++) {
    let total: i16 = 0;
    let min: i16 = 256;
    // Convert offsets to y values & calculate min y value
    for (let j = 128; j >= 1; j--) {
      const pOffset = mapOffsets[i][j]
      mapOffsets[i][j] = total;
      total += pOffset;
      
      if (total < min) {
        min = total;
      }
    }

    mapOffsets[i][0] = total;
    mapBlocks[i][0] = 34;
    
    let newMax: i16 = 0;
    // Move the lines so that their lowest point is 0 & calculate max y value
    for (let j = 0; j < 129; j++) {
      mapOffsets[i][j] -= min;

      if (mapOffsets[i][j] > newMax) {
        newMax =  mapOffsets[i][j];
      }
    }

    if (max < newMax) {
      max = newMax;
    }
  }

  max+=3; // Providing more room for fire protection

  printStr("Converting to NBT...");
  let totalBlocks: i32 = mapW * mapH;
  
  const x: i64 = offset+2;
  const y: i64 = max;
  const z: i64 = 130;
  // const totalBlocks = 32;

  // const x: i64 = 7;
  // const y: i64 = 1;
  // const z: i64 = 7;
  
  const palette = new Array<String>();
  palette.push("minecraft:air");
  
  const blocksList = new Array<Array<Array<i64>>>(<i32>x);
  for (let i = 0; i < x; i++) {
    blocksList[i] = new Array<Array<i64>>(<i32>z);
    for (let j = 0; j < z; j++) {
      blocksList[i][j] = new Array<i64>(<i32>y);
      blocksList[i][j].fill(0);
    }
  }
  
  for (let i = 0; i < offset; i++) {
    for (let j = 0; j < 129; j++) {
      let v = palette.indexOf(blocks[mapBlocks[i][j]]);
      if (v == -1) {
        v = palette.length;
        palette.push(blocks[mapBlocks[i][j]]);
      }
      blocksList[i+1][j][mapOffsets[i][j]+1] = v;
    }
  }

  
  let bitsPerBlock: i64 = 2;
  const paletteLen: i64 = palette.length;
  while (2 ** bitsPerBlock < paletteLen) bitsPerBlock++;
  const maxVal: i64 = (1 << bitsPerBlock) - 1;
  const layerSize = x*z;

  const blockStates = new Array<i64>(<i32>((x*y*z*bitsPerBlock) >> 6) + 1);
  blockStates.fill(0);

  printStr("Writing long array...");
  for (let k = 0; k < y; k++) {
    for (let j = 0; j < z; j++) {
      for (let i = 0; i < x; i++) {
        // basically stolen from litematica's source code, https://github.com/maruohon/litematica/blob/bbaff6967238773ccbdbc302808d4832ac2697b6/src/main/java/fi/dy/masa/litematica/schematic/container/LitematicaBitArray.java#L43
        const index = (k*layerSize+j*x+i);
        const startOffset = index*bitsPerBlock;
        const startLongOffset = <i32>(startOffset >> 6); // Find the index in the long array the number starts in
        const endLongOffset = <i32>(((index + 1) * bitsPerBlock - 1) >> 6); // The index in the long array that the number ends in
        const bitOffset: i32 = <i32>(startOffset & 0b111111); // %64, find the position in the long the number starts in
        blockStates[startLongOffset] = (blockStates[startLongOffset] & (~(maxVal << bitOffset))) | (blocksList[i][j][k] << bitOffset); // Insert the value in the first long
        
        // If the value overflows, send part of it to the other long value
        if (startLongOffset != endLongOffset) {
          const endBitOffset = 64 - bitOffset; // Calculate the offset on the other long array
          const overflowed = bitsPerBlock - endBitOffset; // Calculate the amount of bits that overflowed
          blockStates[endLongOffset] = ((blockStates[endLongOffset] >>> overflowed) << overflowed) | (blocksList[i][j][k] >> endBitOffset); // Insert the value that overflowed
        }
      }
    }
  }
  
  printStr("Compiling NBT data...");
  const nbt = new NBT("", true, compound, true);
  
  const metadata = new NBT("");
  
  const enclosingSize = new NBT("");
  enclosingSize.ints.set("x", <i32>x);
  enclosingSize.ints.set("y", <i32>y);
  enclosingSize.ints.set("z", <i32>z);
  
  metadata.compounds.set("EnclosingSize", enclosingSize);
  metadata.strings.set("Author", "Some rando computer");
  metadata.strings.set("Description", "Some map thingy");
  metadata.strings.set("Name", "A map");
  metadata.ints.set("RegionCount", 1);
  const t = Date.now();
  metadata.longs.set("TimeCreated", t);
  metadata.longs.set("TimeModified", t);
  metadata.ints.set("TotalBlocks", totalBlocks);
  metadata.ints.set("TotalVolume", <i32>(x*y*z));
  
  const regions = new NBT("");
  
  const map = new NBT("");
  
  const position = new NBT("");
  position.ints.set("x", 0);
  position.ints.set("y", 0);
  position.ints.set("z", 0);
  
  const size = new NBT("");
  size.ints.set("x", <i32>x);
  size.ints.set("y", <i32>y);
  size.ints.set("z", <i32>z);
  
  const paletteNbt = new NBT("", false, compound);
  for (let i = 0; i < palette.length; i++) {
    const paletteElem = new NBT("");
    paletteElem.strings.set("Name", palette[i]);
    paletteNbt.compounds.set(palette[i], paletteElem);
  }

  map.compounds.set("Position", position);
  map.compounds.set("Size", size);
  map.lists.set("BlockStatePalette", paletteNbt);
  map.lists.set("Entities", new NBT("", false, compound));
  map.lists.set("PendingBlockTicks", new NBT("", false, compound));
  map.lists.set("PendingFluidTicks", new NBT("", false, compound));
  map.lists.set("TileEntities", new NBT("", false, compound));
  map.longArrays.set("BlockStates", blockStates);

  regions.compounds.set("Map", map);

  nbt.compounds.set("Metadata", metadata);
  nbt.compounds.set("Regions", regions);
  nbt.ints.set("MinecraftDataVersion", 2230);
  nbt.ints.set("Version", 5);

  return nbt.toUint8Array(nbt.compile());
}



// NBT implementation
const end: u8 = 0;
const byte: u8 = 1;
const short: u8 = 2;
const int: u8 = 3;
const long: u8 = 4;
const float: u8 = 5;
const double: u8 = 6;
const byteArray: u8 = 7;
const string: u8 = 8;
const list: u8 = 9;
const compound: u8 = 10;
const intArray: u8 = 11;
const longArray: u8 = 12;

class NBT {
  name: String;
  named: bool;
  type: u8;
  root: bool;
  bytes: Map<String, i8> = new Map<String, i8>();
  shorts: Map<String, i16> = new Map<String, i16>();
  ints: Map<String, i32> = new Map<String, i32>();
  longs: Map<String, i64> = new Map<String, i64>();
  floats: Map<String, f32> = new Map<String, f32>();
  doubles: Map<String, f64> = new Map<String, f64>();
  byteArrays: Map<String, Array<i8>> = new Map<String, Array<i8>>();
  strings: Map<String, String> = new Map<String, String>();
  lists: Map<String, NBT> = new Map<String, NBT>();
  compounds: Map<String, NBT> = new Map<String, NBT>();
  intArrays: Map<String, Array<i32>> = new Map<String, Array<i32>>();
  longArrays: Map<String, Array<i64>> = new Map<String, Array<i64>>();

  constructor(name: String, named: bool = true, type: u8 = 0, root: bool = false) {
    this.name = name;
    this.named = named;
    this.type = type;
    this.root = root;
  }

  compile(): Array<u8> {
    let ret = new Array<u8>();

    let count: i32 = 0;

    let keys = this.bytes.keys();
    let len = keys.length;
    for (let i = 0; i < len; i++) {
      if (this.named) {
        ret.push(byte);
        ret = ret.concat(this.compileString(keys[i]));
      } else {
        count++;
      }
      ret = ret.concat(this.compileByte(this.bytes.get(keys[i])));
    }

    keys = this.shorts.keys();
    len = keys.length;
    for (let i = 0; i < len; i++) {
      if (this.named) {
        ret.push(short);
        ret = ret.concat(this.compileString(keys[i]));
      } else {
        count++;
      }
      ret = ret.concat(this.compileShort(this.shorts.get(keys[i])));
    }

    keys = this.ints.keys();
    len = keys.length;
    for (let i = 0; i < len; i++) {
      if (this.named) {
        ret.push(int);
        ret = ret.concat(this.compileString(keys[i]));
      } else {
        count++;
      }
      ret = ret.concat(this.compileInt(this.ints.get(keys[i])));
    }

    keys = this.longs.keys();
    len = keys.length;
    for (let i = 0; i < len; i++) {
      if (this.named) {
        ret.push(long);
        ret = ret.concat(this.compileString(keys[i]));
      } else {
        count++;
      }
      ret = ret.concat(this.compileLong(this.longs.get(keys[i])));
    }

    keys = this.floats.keys();
    len = keys.length;
    for (let i = 0; i < len; i++) {
      if (this.named) {
        ret.push(float);
        ret = ret.concat(this.compileString(keys[i]));
      } else {
        count++;
      }
      ret = ret.concat(this.compileFloat(this.floats.get(keys[i])));
    }

    keys = this.doubles.keys();
    len = keys.length;
    for (let i = 0; i < len; i++) {
      if (this.named) {
        ret.push(double);
        ret = ret.concat(this.compileString(keys[i]));
      } else {
        count++;
      }
      ret = ret.concat(this.compileDouble(this.doubles.get(keys[i])));
    }

    keys = this.byteArrays.keys();
    len = keys.length;
    for (let i = 0; i < len; i++) {
      if (this.named) {
        ret.push(byteArray);
        ret = ret.concat(this.compileString(keys[i]));
      } else {
        count++;
      }
      ret = ret.concat(this.compileByteArray(this.byteArrays.get(keys[i])));
    }

    keys = this.strings.keys();
    len = keys.length;
    for (let i = 0; i < len; i++) {
      if (this.named) {
        ret.push(string);
        ret = ret.concat(this.compileString(keys[i]));
      } else {
        count++;
      }
      ret = ret.concat(this.compileString(this.strings.get(keys[i])));
    }

    keys = this.lists.keys();
    len = keys.length;
    for (let i = 0; i < len; i++) {
      if (this.named) {
        ret.push(list);
        ret = ret.concat(this.compileString(keys[i]));
      } else {
        count++;
      }
      ret = ret.concat(this.compileNBT(this.lists.get(keys[i])));
    }

    keys = this.compounds.keys();
    len = keys.length;
    for (let i = 0; i < len; i++) {
      if (this.named) {
        ret.push(compound);
        ret = ret.concat(this.compileString(keys[i]));
      } else {
        count++;
      }
      ret = ret.concat(this.compileNBT(this.compounds.get(keys[i])));
    }

    keys = this.intArrays.keys();
    len = keys.length;
    for (let i = 0; i < len; i++) {
      if (this.named) {
        ret.push(intArray);
        ret = ret.concat(this.compileString(keys[i]));
      } else {
        count++;
      }
      ret = ret.concat(this.compileIntArray(this.intArrays.get(keys[i])));
    }

    keys = this.longArrays.keys();
    len = keys.length;
    for (let i = 0; i < len; i++) {
      if (this.named) {
        ret.push(longArray);
        ret = ret.concat(this.compileString(keys[i]));
      } else {
        count++;
      }
      ret = ret.concat(this.compileLongArray(this.longArrays.get(keys[i])));
    }

    if (this.root) {
      const beginning = new Array<u8>();
      beginning.push(compound);
      ret = beginning.concat(this.compileString(this.name).concat(ret));
    }

    if (this.named) {
      ret.push(end);
    } else {
      let amt: u8 = 0;
      if (this.bytes.size > 0) amt++;
      if (this.shorts.size > 0) amt++;
      if (this.ints.size > 0) amt++;
      if (this.longs.size > 0) amt++;
      if (this.floats.size > 0) amt++;
      if (this.doubles.size > 0) amt++;
      if (this.byteArrays.size > 0) amt++;
      if (this.strings.size > 0) amt++;
      if (this.lists.size > 0) amt++;
      if (this.compounds.size > 0) amt++;
      if (this.intArrays.size > 0) amt++;
      if (this.longArrays.size > 0) amt++;
      if (amt > 1) throw new Error(`A list has multiple types in it`);
      const beginning = this.compileInt(count);
      beginning.unshift(this.type);
      ret = beginning.concat(ret);
    }

    return ret;
  }

  toUint8Array(ret: Array<u8>): Uint8ClampedArray {
    const actualRet = new Uint8ClampedArray(ret.length);
    for (let i = ret.length-1; i >= 0; i--) {
      actualRet[i] = ret[i];
    }
    return actualRet;
  }
  
  compileByte(value: i8): Array<u8> {
    const ret = new Array<u8>(1);
    ret[0] = value;
    
    return ret;
  }
  
  compileShort(value: i16): Array<u8> {
    const ret = new Array<u8>(2);
    ret[0] = <u8>(value >>> 8);
    ret[1] = <u8>(value & 0b11111111);
    return ret;
  }

  compileInt(value: i32): Array<u8> {
    const ret = new Array<u8>(4);
    for (let i = 3; i >= 0; i--) {
      ret[i] = <u8>(value & 0b11111111);
      value = value >>> 8;
    }
    return ret;
  }

  compileLong(value: i64): Array<u8> {
    const ret = new Array<u8>(8);
    for (let i = 7; i >= 0; i--) {
      ret[i] = <u8>(value & 0b11111111);
      value = value >>> 8;
    }
    return ret;
  }

  compileFloat(value: f32): Array<u8> {
    return this.compileInt(reinterpret<i32>(value));
  }

  compileDouble(value: f64): Array<u8> {
    return this.compileLong(reinterpret<i64>(value));
  }

  compileByteArray(value: Array<i8>): Array<u8> {
    const len = value.length;
    const ret = this.compileInt(len);

    for (let i = 0; i < len; i++) {
      ret.push(value[i]);
    }
    return ret;
  }

  compileString(value: String): Array<u8> {
    const data = stringToUtf8(value);
    if (data.length > 32767) throw new Error(`Your string ${value} is too long`);
    return this.compileShort(<i16>data.length).concat(data);
  }

  compileNBT(value: NBT): Array<u8> {
    return value.compile();
  }

  compileIntArray(value: Array<i32>): Array<u8> {
    const len = value.length;
    let ret = this.compileInt(len);

    for (let i = 0; i < len; i++) {
      const v = this.compileInt(value[i])
      for (let j = 0; j < 4; j++) {
        ret.push(v[j]);
      }
    }
    return ret;
  }

  compileLongArray(value: Array<i64>): Array<u8> {
    const len = value.length;
    let ret = this.compileInt(len);

    for (let i = 0; i < len; i++) {
      const v = this.compileLong(value[i])
      for (let j = 0; j < 8; j++) {
        ret.push(v[j]);
      }
    }
    return ret;
  }
}