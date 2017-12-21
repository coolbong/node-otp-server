/*
Copyright (c) 2011, Chris Umbel
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
var charTable = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
var byteTable = [
  0xff, 0xff, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f,
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06,
  0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e,
  0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16,
  0x17, 0x18, 0x19, 0xff, 0xff, 0xff, 0xff, 0xff,
  0xff, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06,
  0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e,
  0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16,
  0x17, 0x18, 0x19, 0xff, 0xff, 0xff, 0xff, 0xff
];

function quintetCount(buff) {
  var quintets = Math.floor(buff.length / 5);
  return buff.length % 5 === 0 ? quintets: quintets + 1;
}

var bufferToBase32 = function(plain) {
  // plain MUST come in either as Array or Uint8Array
  if('undefined' !== typeof Uint8Array) {
    if (!(plain instanceof Uint8Array)){
      plain = new Uint8Array(plain);
    }
  }
  var i = 0;
  var j = 0;
  var shiftIndex = 0;
  var digit = 0;
  var encoded = new Array(quintetCount(plain) * 8);

  /* byte by byte isn't as pretty as quintet by quintet but tests a bit
      faster. will have to revisit. */
  while(i < plain.length) {
    var current = plain[i];

    if(shiftIndex > 3) {
      digit = current & (0xff >> shiftIndex);
      shiftIndex = (shiftIndex + 5) % 8;
      digit = (digit << shiftIndex) | ((i + 1 < plain.length) ?
        plain[i + 1] : 0) >> (8 - shiftIndex);
      i++;
    } else {
      digit = (current >> (8 - (shiftIndex + 5))) & 0x1f;
      shiftIndex = (shiftIndex + 5) % 8;
      if(shiftIndex === 0) { i++; }
    }

    encoded[j] = charTable[digit];
    j++;
  }

  for(i = j; i < encoded.length; i++) {
    encoded[i] = '=';
  }

  return encoded.join('');
};

var base32ToBuffer = function(encoded) {
  var shiftIndex = 0;
  var plainDigit = 0;
  var plainChar;
  var plainPos = 0;
  var len = Math.ceil(encoded.length * 5 / 8);
  var decoded;
  encoded = encoded.split('').map(function (ch) {
    return ch.charCodeAt(0);
  });
  if('undefined' !== typeof Uint8Array) {
    encoded = new Uint8Array(encoded);
    decoded = new Uint8Array(len);
  } else {
    decoded = new Array(len);
  }

  /* byte by byte isn't as pretty as octet by octet but tests a bit
      faster. will have to revisit. */
  for(var i = 0; i < encoded.length; i++) {
    if(encoded[i] === 0x3d){ //'='
      break;
    }

    var encodedByte = encoded[i] - 0x30;

    if(encodedByte < byteTable.length) {
      plainDigit = byteTable[encodedByte];

      if(shiftIndex <= 3) {
        shiftIndex = (shiftIndex + 5) % 8;

        if(shiftIndex === 0) {
          plainChar |= plainDigit;
          decoded[plainPos] = plainChar;
          plainPos++;
          plainChar = 0;
        } else {
          plainChar |= 0xff & (plainDigit << (8 - shiftIndex));
        }
      } else {
        shiftIndex = (shiftIndex + 5) % 8;
        plainChar |= 0xff & (plainDigit >>> shiftIndex);
        decoded[plainPos] = plainChar;
        plainPos++;

        plainChar = 0xff & (plainDigit << (8 - shiftIndex));
      }
    } else {
      throw new Error('Invalid input - it is not base32 encoded string');
    }
  }

  if (decoded.slice) { // Array or TypedArray
    return decoded.slice(0, plainPos);
  } else { // Mobile Safari TypedArray
    return new Uint8Array(Array.prototype.slice.call(decoded, 0, plainPos));
  }
};

function bufferToHex(arr) {
  var i;
  var len;
  var hex = '';
  var c;

  for (i = 0, len = arr.length; i < len; i += 1) {
    c = arr[i].toString(16);
    if (c.length < 2) {
      c = '0' + c;
    }
    hex += c;
  }

  return hex;
}

function hexToBuffer(hex) {
  // TODO use Uint8Array or ArrayBuffer or DataView
  var i;
  var byteLen = hex.length / 2;
  var arr;
  var j = 0;

  if (byteLen !== parseInt(byteLen, 10)) {
    throw new Error("Invalid hex length '" + hex.length + "'");
  }

  arr = new Uint8Array(byteLen);

  for (i = 0; i < byteLen; i += 1) {
    arr[i] = parseInt(hex[j] + hex[j + 1], 16);
    j += 2;
  }

  return arr;
}



var random = require('node-cardcrypto').random;
var mac = require('node-cardcrypto').mac;

var keys = ['tzu5 p5gv enps qmze xqnp yhtq l4ds 3gil',
'ri6w r5fi adkd 6wuj qavn sovu 36u3 huq5',
'5dhj qetr vlee jj3q vyad 7quc 7p77 yu2f',
'pk7m db4c tabq ozpb do3m rtsm 67j5 p64h'];


function base32toHexString(data) {
  data = data.replace(/\s/g, '');
  data = base32ToBuffer(data);
  data = Buffer.from(data).toString('hex').toUpperCase();
  data = data.replace(/(\w{2})/g, "$1 ").trim();
  return data;
}

function hexStringtoBase32(data) {
  data = data || random.random(20);
  data = data.replace(/\s/g, '');
  data = hexToBuffer(data);
  data = bufferToBase32(data);
  data = data.replace(/(\w{4})/g, "$1 ").toLowerCase().trim();
  return data;
}

function main() {
  console.log('hello world');
  keys.forEach(function(item) {
    //console.log('base32 input : ' + item);
    var hex = base32toHexString(item);
    //console.log('buffer output: ' + hex);
    var base32 = hexStringtoBase32(hex);
    // console.log('buffer to base32 : ' + base32);
    // console.log('');
  });

  var key1 = base32toHexString(keys[0]);
  // make otp
  // console.log(key1);
  // mac.hmac_sha1(key1, )

  //

}

main();