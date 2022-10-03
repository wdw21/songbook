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
    for (let i=0; i < this.parentNode.childNodes.length; ++i) {
      if (this.parentNode.childNodes[i] == this) {
        this.nr.innerText = (i+1)+".";
      }
    }
  }

  attributeChangedCallback() {
    console.log("onChange", this);
  }
}

function SongVerseInit() {
  customElements.define("song-verse", SongVerse);
}