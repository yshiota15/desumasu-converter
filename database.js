let srcstrct = {};
// let trnsstrct = {};
let srcstrcts = [];
let trnsstrcts = [];
let lineN = 0;
let selection = {};

function getSrc(){return srcstrcts[lineN];};
function getSrcs(){return srcstrcts;};

function getTrns(){return trnsstrcts[lineN]};
function getTrnss(){return trnsstrcts};

function getSelection(){return selection};

function init(srctxt){
  // srcstrct = searchKeys(srctxt);
  // trnsstrct = translateKeyValue(srcstrct);

  srctxt = srctxt.replace(/\s+/g, "");
  let srcsplit = srctxt.split(/([。！？\!\?])/);
  let srclines = [];
  let i = 1;
  while(i < srcsplit.length){
    srclines.push(srcsplit[i-1] + srcsplit[i]);
    i += 2;
  }
  if(srcsplit[i-1] != "") srclines.push(srcsplit[i-1]);
  srcstrcts = srclines.map(x => searchKeys(x));
  trnsstrcts = srcstrcts.map(x => translateKeyValue(x));
  changeLine(0);
}

function changeLine(n){
  if(n >= 0 && n < srcstrcts.length){
    lineN = n;
    lineIndex.innerHTML = `<${lineN+1}/${srcstrcts.length}>`;
    srcstrct = srcstrcts[n];
    // trnsstrct = trnsstrcts[n];
    resetSelect();
    translationText.scrollTop = (translationText.scrollHeight - translationText.clientHeight) * n / srcstrcts.length;
  }
}

function moveLine(d){
  changeLine(lineN + d);
}

function setSelect(_selection){
  selection = _selection;
}

function setDropdownContents(){
  var dropdownMenu = [];
  if(selection && trnsphrase.value != selection.trnsOrigin){
    dropdownMenu.push({
      value:"適用",
      action:apply,
    });
    dropdownMenu.push({
      value:"全てに適用",
      action:applyAll,
    });
  }
  if(selection && selection.rep.filter(x => x.apply).length > 0){
    dropdownMenu.push({
      value:"無視",
      action:ignore,
    });
    if(selection.rep.filter(x => !x.fromdict).length == 0){
      dropdownMenu.push({
        value:"変換を削除",
        action:unapplyAll,
      });
    }
  }
  else if(selection && selection.rep.filter(x => x.fromdict).length > 0){
    dropdownMenu.push({
      value:"無視を解除",
      action:unignore,
    });
  }

  myDropdown.innerHTML = "";
  dropdownMenu.forEach(x=>{
    let btn = document.createElement("button");
    myDropdown.appendChild(btn);
    btn.innerText = x.value;
    btn.onclick = () => {
      actionbtn.innerText = x.value;
      actionbtn.onclick = x.action;
    }
  });

  if(dropdownMenu.length > 0){
    vbtn.disabled = false;
    // vbtn.style.display = "inline";
    actionbtn.disabled = false;
    // actionbtn.style.display = "inline";
    actionbtn.innerText=dropdownMenu[0].value;
    actionbtn.onclick = dropdownMenu[0].action;
  }
  else{
    vbtn.disabled = true;
    // vbtn.style.display = "none";
    actionbtn.disabled = true;
    // actionbtn.style.display = "none";
    actionbtn.innerText="-";
    actionbtn.onclick = "";
  }
  
}

function toggleDropdown(){
  document.getElementById("myDropdown").classList.toggle("show");
};

function apply(){
  update(srcphrase.value, trnsphrase.value);
  resetSelect();
  // updateTranslation();
};

function update(srcw, trnsw){
  if(selection){
    if(trnsw == blancsymbol || trnsphrase.value == blancdisplay) return;
    if(trnsw == "") trnsw = blancsymbol;
    let prior = srcstrct.replace.filter(x => x.pos == selection.srcStart && !x.fromdict);
    prior.forEach(x => x.apply = false);
    srcstrct.replace = srcstrct.replace.filter(x => x.apply || x.fromdict);
    srcstrct.replace.push(
      {
        srcw:srcw,
        trnsw:trnsw,
        length:srcw.length,
        pos:selection.srcStart,
        apply:true,
        fromdict:false,
        hiding:false
      }
    )
  }
  srcstrct.replace.sort(function(a,b){
    return (a.pos-b.pos) * 2 + ((a.fromdict === b.fromdict)? 0 : a.fromdict? 1 : -1)
  });
  trnsstrcts[lineN] = translateKeyValue(srcstrct);
}

function applyAll(){
  if(trnsphrase.value == blancsymbol || trnsphrase.value == blancdisplay){
    resetSelect();
    return;
  } 
  insertDict(srcphrase.value, trnsphrase.value);
  srcstrcts = srcstrcts.map(x => applyDict(x));
  trnsstrcts = srcstrcts.map(x => translateKeyValue(x));
  resetSelect();
}

function ignore(){
  if(!selection)
    return;
  let prior = srcstrct.replace.filter(x => x.pos == selection.srcStart && x.srcw == srcphrase.value);
  if(prior.filter(x => !x.fromdict).length > 0){
    prior.filter(x => !x.fromdict).forEach(x => x.apply = false);
  }
  else{
    prior.forEach(x => x.apply = false);
  }
  srcstrct.replace = srcstrct.replace.filter(x => x.apply || x.fromdict);
  // srcstrct.replace.sort(function(a,b){return a.pos-b.pos});
  trnsstrcts[lineN] = translateKeyValue(srcstrct);
  resetSelect();
}

function unignore(){
  if(!selection)
    return;
  let prior = srcstrct.replace.filter(x => x.pos == selection.srcStart && x.fromdict && !x.apply);
  prior.forEach(x => x.apply = true);
  trnsstrcts[lineN] = translateKeyValue(srcstrct);
  resetSelect();
}

function unapplyAll(){
  deleteDict(srcphrase.value);
  srcstrcts = srcstrcts.map(x => applyDict(x));
  // trnsstrct = translateKeyValue(srcstrct);
  trnsstrcts = srcstrcts.map(x => translateKeyValue(x));
  resetSelect();
}

function applyDict(srcstrct){
  let srcstrct_new = searchKeys(srcstrct.body);
  let applied = srcstrct.replace.filter(x => !x.fromdict);
  srcstrct_new.replace = srcstrct_new.replace.concat(applied);
  srcstrct_new.replace.sort(function(a,b){return a.pos-b.pos});
  srcstrct_new.replace.forEach(x => {
    if(x.fromdict){
      match = srcstrct.replace.filter(y => y.pos == x.pos && y.srcw == x.srcw && y.fromdict);
      if(match.length > 0)
        x.apply = match[0].apply;
      }    
  });
  return srcstrct_new;
}

function updateTranslation(){
  translationText.innerHTML = "";
  trnsstrcts.forEach((x, i) => {
    let html = generateHTML(x, "valueword");
    html = html.replace(blancReg, "");
    if(i == lineN)
      html = "<span class=currentLine>" + html + "</span>";
    translationText.innerHTML += html;
  })
}