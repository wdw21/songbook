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
  <div class="verse_main"><slot/></div>
</div>
  `;

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.appendChild(template.content.cloneNode(true));
    this.nr=shadow.getElementById("nr");
  }

  connectedCallback() {
    this.refreshPosition(this)
    this.observer = new MutationObserver(() => this.refreshPosition(this));
    this.observer.observe(this.parentNode, { attributes: false, childList: true, subtree: false });
  }

  refreshPosition(verse) {
    for (let i=0; i < verse.parentNode.childNodes.length; ++i) {
      if (verse.parentNode.childNodes[i] == this) {
        verse.nr.innerText = (i+1)+".";
      }
    }
  }

  attributeChangedCallback() {
    console.log("onChange", this);
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