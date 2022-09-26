// Return index of first letter that is different
function commonPrefix(s1, s2) {
  for (let i=0; i < Math.min(s1.length, s2.length); ++i) {
    if (s1[i] != s2[i]) {
      return i;
    }
  }
  return Math.min(s1.length, s2.length);
}

// Return length of the common suffix;
function commonSuffix(s1, s2) {
  for (let i=0; i < Math.min(s1.length, s2.length); ++i) {
    if (s1[s1.length - i - 1] != s2[s2.length - i - 1]) {
      return i;
    }
  }
  return Math.min(s1.length, s2.length);
}

function onInput(el) {
  console.log('x');
  if (el.previousValue != null &&
      el.previousSelectionStart != null &&
      el.previousSelectionEnd != null && el.previousValue != el.value) {

    if (el.previousValue.substring(el.previousSelectionEnd) ==
        el.value.substring(el.selectionEnd)) {
      console.log("Standard change")
      const rect = el.parentNode.getBoundingClientRect();
      let f=el.parentNode.getElementsByClassName("ch");
      for (let i=0; i<f.length; ++i) {
          let ch=f.item(i)
          if (ch.pos >= el.previousSelectionStart) {
            ch.pos = Math.max(0, ch.pos + el.selectionEnd - el.previousSelectionEnd);
            p = getCaretCoordinates(el, ch.pos)
            ch.style.left = rect.x + window.scrollX + p.left + 'px';
          }
      }
    }else{

    }
  }

  el.previousValue = el.value;
  el.previousSelectionStart = el.selectionStart;
  el.previousSelectionEnd = el.selectionEnd;
}


function showRow(row, targetDiv) {
  // p = document.createElement('p');
  // p.appendChild(document.createTextNode(new XMLSerializer().serializeToString(row)));
  // targetDiv.appendChild(p)
  let text = '';
  let chords = [];
  row.childNodes.forEach(function (node) {
        if (node.nodeName === '#text') {
          text += node.nodeValue;
        }
        if (node.nodeName === "ch") {
          chords.push({'ch': node.attributes['a'].nodeValue, 'pos': text.length})
        }
      }
  );

  let input = document.createElement("input");
  input.type = 'text'
  input.maxLength = 200;
  input.value = text;
  input.style.width = 400;
  input.oninput = (() => {onInput(input)});
  // TODO: These can be lighter ... to just check caret position.
  input.onfocus = (() => {onInput(input)});
  input.onselect = (() => {onInput(input)});
  input.onkeydown = (() => {onInput(input)});
  input.onmousedown = (() => {onInput(input)});
  input.onpaste = (() => {onInput(input)});
  input.oncut = (() => {onInput(input)});
  input.onmousemove = (() => {onInput(input)});
  input.onselectstart = (() => {onInput(input)});

  targetDiv.appendChild(input);
  const rect = input.getBoundingClientRect();
  console.log(rect)

  for (let i = 0; i < chords.length; i++) {
    let p=getCaretCoordinates(input, chords[i].pos);

    var ch = document.createElement('div');
    ch.id = 'bookingLayer';
    ch.style.position = 'absolute';
    ch.style.left = (rect.x + window.scrollX + p.left) + 'px';
    ch.style.top = (rect.y + window.scrollY + p.top - 11) + 'px';
    ch.innerHTML = chords[i].ch;
    ch.className = 'ch'
    ch.pos = chords[i].pos
    targetDiv.appendChild(ch)
  }


//  console.log(chords);
}

function onChange(el) {
 // el = document.getElementById("t1")
  const rect = el.getBoundingClientRect();
  for (let i=0; i<el.value.length; i++)
  {
    if (el.value[i]==='_') {
      p = getCaretCoordinates(el, i)

      var myLayer = document.createElement('div');
      myLayer.id = 'bookingLayer';
      myLayer.style.position = 'absolute';
      myLayer.style.left = rect.x + window.scrollX + p.left + 'px';
      myLayer.style.top = rect.y + window.scrollY + p.top + 'px';
    //  myLayer.style.width = '300px';
    //  myLayer.style.height = '300px';
    //  myLayer.style.padding = '10px';
      myLayer.style.background = '#00ff00';
      myLayer.innerHTML = 'X';
      document.body.appendChild(myLayer);
    }
  }
}

function onLoad() {
  text = '<?xml version="1.0" encoding="utf-8"?><row important_over="true">St<ch a="a"/>anął w ogniu nasz wi<ch a="G"/>elki dom</row>';

  parser = new DOMParser();
  xmlDoc = parser.parseFromString(text, "text/xml");

  showRow(
      xmlDoc.getRootNode().childNodes[0],
      document.getElementById("editor"));
}