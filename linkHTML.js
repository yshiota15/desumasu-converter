const threshold = 8;
let selected = false;
const eolReg = /。|！|？|\!|\?/g;

function getProcessedSelection(){
  let selection = document.getSelection();
  if(selection.isCollapsed){
    return selection;
  }
  if (selection.anchorNode.parentElement.parentElement != selection.focusNode.parentElement.parentElement){
    return selection;
  }

  let inverse = {
    anchorNode:selection.focusNode,
    anchorOffset:selection.focusOffset,
    focusNode:selection.anchorNode,
    focusOffset:selection.anchorOffset,
    isCollapsed:selection.isCollapsed
  };
  if(selection.anchorNode.parentElement == selection.focusNode.parentElement){
    if(selection.anchorOffset > selection.focusOffset){
      return inverse
    }
  }
  else{
    let anchorI = getIndex(selection.anchorNode.parentNode);
    let focusI = getIndex(selection.focusNode.parentNode);
    if(anchorI > focusI){
      return inverse;
    }
  }
  return selection;
}

function initEvent(){
  document.onmouseup = function() {
    let selection = getProcessedSelection();
    
    if(!selection || !selection.anchorNode || !selection.focusNode){
      // console.log("selection is null.");
      return;
    }
    if(selection.anchorNode.parentElement.closest("#srcbox") && selection.anchorNode.parentElement.closest("#srcbox")){
      selectWords(selection);
    }
    else if(selection.anchorNode.parentElement.closest("#tgtbox") && selection.anchorNode.parentElement.closest("#tgtbox")){
      selectWords(selection);
    }
  };
  
}

function syncScroll(){
  let srcRange = srcbox.scrollHeight - srcbox.clientHeight;
  let tgtRange = tgtbox.scrollHeight - tgtbox.clientHeight;
  srcbox.onscroll = function(){
    tgtbox.scrollTop = this.scrollTop / srcRange * tgtRange;
  };
  tgtbox.onscroll = function(){
    console.log("scroll changed.");
  }
}

function generateHTML(strct, classname, selection=null){
  let index = 0;
  let splitted = [];
  let ignoreIndices = [];
  let hideCount = 0;
  strct.replace.forEach((rep, i) => {
    if(!rep.hiding){
      if(rep.apply){
        splitted.push(strct.body.slice(index, rep.pos));
        let word = strct.body.slice(rep.pos, rep.pos+rep.length);
        if(word == blancsymbol) word = blancdisplay;
        splitted.push(word);
        index = rep.pos+rep.length;
      }
      else if(rep.fromdict){
        if(i == strct.replace.length-1 || rep.pos + length < strct.replace[i+1].pos){
          splitted.push(strct.body.slice(index, rep.pos));
          splitted.push(strct.body.slice(rep.pos, rep.pos+rep.srcw.length));
          index = rep.pos+rep.srcw.length;
          ignoreIndices.push(i-hideCount);
        }
      }
    }
    else{
      hideCount++;
    }
  });

  splitted.push(strct.body.slice(index));
  // splitted = splitted.map(x => x.replace(eolReg, (match) => {return match + "<br><br>"}));
  // console.log(splitted);
  // console.log(ignoreIndices);

  let html = "";
  let i = 0;
  let repInd = 0;
  // if(splitted.length <= 1){
  //   return strct.body;
  // } 

  while(i < splitted.length){
    
    if(selection && (i == selection.start || i == selection.end)){
      if(selection.start == selection.end){
        html += splitted[i].slice(0, selection.anchorOffset);
        html += "<span class=selected>";
        html += splitted[i].slice(selection.anchorOffset, selection.focusOffset);
        html += "</span>";
        html += splitted[i].slice(selection.focusOffset);
      }
      else{
        if(i == selection.start){
          html += splitted[i].slice(0, selection.anchorOffset);
          html += "<span class=selected>";
          html += splitted[i].slice(selection.anchorOffset);
        }
        if(i == selection.end){
          html += splitted[i].slice(0, selection.focusOffset);
          html += "</span>";
          html += splitted[i].slice(selection.focusOffset);
        }
      }
        
      i++;
    }
    else{
      html += "<span>";
      html += splitted[i++];
      html += "</span>";
    }
    if(i >= splitted.length){
      break;
    }
    if(selection && i == selection.start){
      html += "<span class=selected>";
    }
    if(ignoreIndices.includes(repInd)){
      html += "<span class=\"" + classname + " ignored\">";
    }
    else{
      html += "<span class=" + classname + ">";
    }
    html += splitted[i];
    html += "</span>";
    if(selection && i == selection.end){
      html += "</span>";
    }
    i++;
    repInd++;
  }

  return html;
}

function syncHover(){
  let keys = srcbox.getElementsByClassName("keyword");
  let values = tgtbox.getElementsByClassName("valueword");
  for(let i = 0; i < keys.length && i < values.length; i++){
    keys[i].addEventListener('mouseover', ()=>{
      keys[i].classList.add('hover');
      values[i].classList.add('hover');
    });
    keys[i].addEventListener('mouseout', ()=>{
      keys[i].classList.remove('hover');
      values[i].classList.remove('hover');
    });
    values[i].addEventListener('mouseover', ()=>{
      keys[i].classList.add('hover');
      values[i].classList.add('hover');
    });
    values[i].addEventListener('mouseout', ()=>{
      keys[i].classList.remove('hover');
      values[i].classList.remove('hover');
    });
  }
}

function getIndex(node){
  let i = 0;
  while((node = node.previousSibling) != null){
    i++;
  }
  return i;
}

function getAccNodeLen(children, i){
  len = 0;
  for(j = 0; j < i; j++){
    len += children[j].innerText.length;
  }
  return len;
}

function resetSelect(){
  srcbox.innerHTML = generateHTML(getSrc(), "keyword");
  tgtbox.innerHTML = generateHTML(getTrns(), "valueword");
  syncHover();
  setSelect(null);
  selected = false;
  srcphrase.value = "";
  trnsphrase.value = "";
  trnsphrase.disabled = true;
  setDropdownContents();
  updateTranslation();
}

function selectWords(selection){
  if(selected){
    return;
  }
  let anchor = selection.anchorNode.parentNode;
  let focus = selection.focusNode.parentNode;
  let anchorOffset = selection.anchorOffset;
  let focusOffset = selection.focusOffset;
  let start = getIndex(anchor);
  let end = getIndex(focus);
  if(anchor.classList.contains("keyword") || anchor.classList.contains("valueword")){
    anchorOffset = 0;
  }
  else if(selection.isCollapsed){
    return;
  }
  if(focus.classList.contains("keyword") || focus.classList.contains("valueword")){
    focusOffset = -1;
  }
  let srcStartI = getAccNodeLen(srcbox.childNodes, start) + anchorOffset;
  let srcEndI = 
    focusOffset != -1 ?
      getAccNodeLen(srcbox.childNodes, end) + focusOffset :
      getAccNodeLen(srcbox.childNodes, end) + srcbox.childNodes[end].innerText.length;
  let trnsStartI = getAccNodeLen(tgtbox.childNodes, start) + anchorOffset;
  let trnsEndI = 
    focusOffset != -1 ? 
      getAccNodeLen(tgtbox.childNodes, end) + focusOffset:
      getAccNodeLen(tgtbox.childNodes, end) + tgtbox.childNodes[end].innerText.length;

  if(srcEndI - srcStartI > threshold || trnsEndI - trnsStartI > threshold){
    return;
  }
  srcphrase.value = srcbox.innerText.slice(srcStartI, srcEndI);
  trnsphrase.value = tgtbox.innerText.slice(trnsStartI, trnsEndI);
  trnsphrase.value = trnsphrase.value.replace(blancReg, "");
  trnsphrase.disabled=false;
  document.getSelection().removeAllRanges();

  let select ={
    start:start,
    end:end,
    anchorOffset:anchorOffset,
    focusOffset:focusOffset
  };
  let rep = [];
  if(start == end){
    rep = getSrc().replace.filter(x => x.pos == srcStartI && (x.apply || x.fromdict));
  }
  setSelect({srcStart:srcStartI, srcEnd:srcEndI, trnsOrigin:trnsphrase.value, rep:rep});
  // console.log(select);
  srcbox.innerHTML = generateHTML(getSrc(), "keyword", select);
  tgtbox.innerHTML = generateHTML(getTrns(), "valueword", select);
  syncHover();
  setDropdownContents();
  trnsphrase.focus();
  selected = true;
}

