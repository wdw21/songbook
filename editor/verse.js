class SongVerse extends HTMLElement {
  constructor() {
    super();

    const template = document.createElement('template');
    template.innerHTML = `
<link rel="stylesheet" href="verse.css"/>
<div class="verse">
  <div class="verse_meta">
    <span id="nr"></span>
    <div>
      <input type="checkbox" id="ref" value="ref" name="refren"/>
      <label for="ref">ref</label>
    </div>
  </div>
  <div id="verse_main" class="verse_main"><slot/></div>
</div>
  `;

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.appendChild(template.content.cloneNode(true));
    this.nr=shadow.getElementById("nr");
    this.ref=shadow.getElementById("ref");
    this.main=shadow.getElementById("verse_main");
    this.ref.addEventListener("input", (e) => this.refoninput(e, this));
  }

  refoninput(e, verse) {
    if (verse.ref.checked) {
      verse.setAttribute("type", "chorus");
    } else {
      verse.setAttribute("type", "verse");
    }
    verse.updateClass()
  }

  updateClass() {
    if (this.getAttribute("type")!=="verse") {
      this.main.classList.add("chorus");
    } else {
      this.main.classList.remove("chorus");
    }
  }

  connectedCallback() {
    this.observer = new MutationObserver((mutations) => {
      console.log("CALLBACK");
      this.refreshPosition(this, mutations);
    } );
    console.log("Observing:", this.parentNode);
    this.refreshPosition(this)
    this.observer.observe(this.parentNode, { attributes: false, childList: true, subtree: false });
  }

  disconnectCallback() {
    console.log("DISCONNECTED");
    this.observer.disconnect();
  }

  refreshPosition(verse, mutations) {
    console.log("Refreshing... ", verse, mutations);
    if (verse.getAttribute('type')==='verse') {
      let j=0;
      for (let i=0; i < verse.parentNode.childNodes.length; ++i) {
        if (verse.parentNode.childNodes[i].getAttribute('type')==='verse') {
          j=j+1;
        }
        if (verse.parentNode.childNodes[i]===this) {
          verse.nr.innerText = j+".X";
          return;
        }
      }
    } else {
      verse.nr.innerText='';
    }
  }

  static get observedAttributes() {
    return ["blocknb", "type"]
  }

  attributeChangedCallback() {
    console.log("Attribute changed...")
    this.ref.checked=this.getAttribute("type") !== "verse";
    this.updateClass();
  }

  refreshAttributes() {
    if (this.getAttribute('type')==='chorus') {
      this.ref.value="true"
    } else {
      this.ref.value="false"
    }
  }
}








class SongBis extends HTMLElement {
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








function SongVerseBisInit() {
  customElements.define("song-verse", SongVerse);
  customElements.define("song-bis", SongBis);
}