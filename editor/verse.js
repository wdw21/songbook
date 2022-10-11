export class SongVerse extends HTMLElement {
  constructor() {
    super();

    const template = document.createElement('template');
    template.innerHTML = `
<link rel="stylesheet" href="./verse.css"/>
<div class="verse">
  <div class="verse_meta">
    <span id="nr"></span>
    <div>
     <label><input id="blocklink" name="blocklink" type="checkbox"/>już było</label>
      <label for="ref"><input type="checkbox" id="ref" value="refren" name="refren"/>refren</label>
    </div>
  </div>
  <div id="verse_link" class="verse_link">
      <select id="verse_link_sel">
        <option>Foo</option>
        <option>Bar</option>
      </select>
  </div>
  <div id="verse_main" class="verse_main">
    <slot/>
  </div>
</div>
  `;

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.appendChild(template.content.cloneNode(true));
    this.nr=shadow.getElementById("nr");
    this.ref=shadow.getElementById("ref");
    this.blocklink=shadow.getElementById("blocklink");
    this.main=shadow.getElementById("verse_main");
    this.link=shadow.getElementById("verse_link");
    this.linkSel=shadow.getElementById("verse_link_sel");
    this.ref.addEventListener("input", (e) => this.refoninput(e, this));
    this.blocklink.addEventListener("input", (e) => this.blocklinkoninput(e, this));
    this.linkSel.addEventListener("input", (e) => this.inputLinkVerse(e, this));
  }

  refoninput(e, verse) {
    if (verse.ref.checked) {
      verse.setAttribute("type", "chorus");
    } else {
      verse.setAttribute("type", "verse");
    }
    verse.updateClass()
    verse.updateVisibility();
  }

  blocklinkoninput(e, verse) {
    if (verse.blocklink.checked) {
      verse.setAttribute("blocknb", "?");
    } else {
      verse.removeAttribute("blocknb");
    }

    verse.updateClass()
    verse.updateVisibility();
  }


  inputLinkVerse(e, verse) {
    let r = document.getElementById(verse.linkSel.value);
    if (r) {
      verse.setAttribute("blocknb", r.id);
      verse.ref.checked = r.isChorus();
    } else {
      verse.setAttribute("blocknb", "?");
      verse.ref.checked = false;
    }
    this.refoninput(e, verse);
  }

  updateClass() {
    if (this.isChorus()) {
      this.main.classList.add("chorus");
      this.link.classList.add("chorus");
    } else {
      this.main.classList.remove("chorus");
      this.link.classList.remove("chorus");
    }
  }

  updateVisibility() {
    if (this.getAttribute("blocknb")) {
      this.main.hidden = true;
      this.link.hidden = false;
      this.ref.disabled = true;
    } else {
      this.main.hidden = false;
      this.link.hidden = true;
      this.ref.disabled = false;
    }
  }

  connectedCallback() {
    if (this.getAttribute("blocknb") &&
        !isNaN(this.getAttribute("blocknb"))) {
      let offset=parseInt(this.getAttribute("blocknb"));
      if (offset && !isNaN(offset)) {
        let j=0;
        let toSet='?';
        for (let i=0; i < this.parentNode.childNodes.length; ++i) {
          let v=this.parentNode.childNodes[i];
          if (v.nodeName==='SONG-VERSE' && !v.getAttribute('blocknb')) {
            j++;
          }
          if (j==offset) {
            toSet=v.id;
            break;
          }
        }
        this.setAttribute("blocknb", toSet);
      }
    }

    this.observer = new MutationObserver((mutations) => this.refreshPosition(this, mutations));
    console.log("Observing:", this.parentNode);
    this.refreshPosition(this)
    this.observer.observe(this.parentNode, { attributes: true, childList: true, subtree: true });
  }

  disconnectedCallback() {
    console.log("DISCONNECTED");
    this.observer.disconnect();
  }

  refreshPosition(verse, mutations) {
    verse.blocklink.disabled=!verse.previousSibling;

    if (!verse.isChorus()) {
      let j=0;
      for (let i=0; i < verse.parentNode.childNodes.length; ++i) {
        let v =verse.parentNode.childNodes[i];
        if (v.nodeName!=='SONG-VERSE') {
          continue;
        }
        if (!v.isChorus()) {
          j=j+1;
        }
        if (v===this) {
          verse.nr.innerText = j+".";
          break;
        }
      }
    } else {
      verse.nr.innerText='Ref:';
    }

    while(verse.linkSel.options.length>0) {
      verse.linkSel.options.remove(0);
    }

    verse.linkSel.add(new Option("[ wybierz zwrotkę ]", "?"));

    for (let i=0; i < verse.parentNode.childNodes.length; ++i) {
      let v = verse.parentNode.childNodes[i];
      if (v == this) {
        break;
      }
      if (v.nodeName==='SONG-VERSE'&& !v.getAttribute("blocknb")) {
        verse.linkSel.add(new Option(v.shortRep(), v.id, false, v.id===verse.getAttribute("blocknb")));
        if (v.id===verse.getAttribute("blocknb")) {
          verse.ref.checked=v.isChorus();
        }
      }
    }

  }

  isChorus() {
    let r=this.getReferred();
    if (r) {
      return r.isChorus();
    } else {
      return this.getAttribute("type") !== 'verse';;
    }
  }

  getReferred() {
    if (this.getAttribute("blocknb")) {
      return document.getElementById(this.getAttribute("blocknb"));
    } else {
      return null;
    }
  }

  shortRep() {
    if (this.childNodes.length<1) {
      return null;
    }

    let rows = this.getElementsByTagName("song-row");
    return rows.length>0? rows[0].innerText : null;
  }

  static get observedAttributes() {
    return ["blocknb", "type"]
  }

  attributeChangedCallback(attr) {
    console.log("Attribute changed...", attr)
    if (attr=='type') {
      this.ref.checked = this.isChorus();
    }
    if (attr=="blocknb") {
      this.blocklink.checked = this.getAttribute("blocknb");
    }
    this.updateClass();
    this.updateVisibility();
  }

  refreshAttributes() {
    if (this.getAttribute('type')==='chorus') {
      this.ref.value="true"
    } else {
      this.ref.value="false"
    }
  }
}








export class SongBis extends HTMLElement {
  constructor() {
    super();

    const template = document.createElement('template');
    template.innerHTML = `
<link rel="stylesheet" href="verse.css"/>
<div class="bis">
  <div class="bis_main"><slot/></div>
  <div class="bis_meta"><label id='xl' for="x">x</label><input type="number" id="x" min="1" max="99"/></div>
</div>
  `;

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.appendChild(template.content.cloneNode(true));
    this.x=shadow.getElementById("x");
    this.x.addEventListener("input", (e) => {this.input(e, this)});
  }

  input(e, songbis) {
    songbis.setAttribute("x", e.target.value);
  }

  connectedCallback() {
    this.attributeChangedCallback();
  }

  attributeChangedCallback() {
    this.x.value = this.getAttribute("x");
  }

  static get observedAttributes() {
    return ["x"]
  }

  focus() {
    this.x.focus();
  }
}



export default function SongVerseBisInit() {
  customElements.define("song-verse", SongVerse);
  customElements.define("song-bis", SongBis);
}