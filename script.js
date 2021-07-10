let dict = {};
let dictkeys = [];
const blancsymbol = "%%blanc%%";
const blancdisplay = "[●]";
const blancReg = /\[●\]/g;

function strSplice(src, start, n, insert){
  return src.slice(0, start) + insert + src.slice(start+n);
}

function insertDict(key, value){
  if(value == "") value = blancsymbol;
  dict[key] = value;
  if(!dictkeys.includes(key))
    dictkeys.unshift(key);
}

function deleteDict(key){
  if(dictkeys.includes(key)){
    dictkeys = dictkeys.filter(x => x != key);
    delete dict[key];
  }
}

function initDict(){
  insertDict("です", "だ");
  insertDict("でした", "だった");
  insertDict("でしょう", "だろう");
}

function searchKeys(src){
  let srcstrct = {
    body:src,
    replace:[]
  };

  for (var key of dictkeys){
    let index = 0;
    while (index != -1){
      index = src.indexOf(key, index);
      if (index != -1){
        srcstrct.replace.push(
          {
            srcw:key,
            trnsw:dict[key],
            length:key.length,
            pos:index,
            apply:true,
            fromdict:true,
            hiding:false,
          }
        )
        index += 1;
      }
    }
  }

  srcstrct.replace.sort(function(a,b){return a.pos-b.pos});
  return srcstrct;
}

function translateKeyValue(srcstrct){
  let trnsstrct = {
    body:"",
    replace:[]
  };
  let trns = srcstrct.body;
  let indexChange = 0;
  let dominant = null;
  for (var rep of srcstrct.replace){
    let dif=0;
    // deal with overlapping
    if(dominant && dominant.apply && rep.pos < dominant.pos + dominant.length){
      rep.hiding = true;
    }
    else {
      rep.hiding = false;
      if(rep.apply){
        dominant = rep;
        trns = strSplice(trns, dominant.pos+indexChange, dominant.length, dominant.trnsw);
        dif = dominant.trnsw.length - dominant.length;
      }
    }
    trnsstrct.replace.push({
      srcw:rep.srcw,
      trnsw:rep.trnsw,
      length:rep.trnsw.length,
      pos:rep.pos+indexChange,
      apply:rep.apply,
      fromdict:rep.fromdict,
      hiding:rep.hiding
    });
    indexChange += dif;
  }
  trnsstrct.body = trns;
  return trnsstrct;
}

function output(){
  let re = new RegExp(blancsymbol, 'g');
  let txts = getTrnss().map(x => x.body.replace(re, ""));
  return txts.join("");
}
