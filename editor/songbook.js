import {SongChInit} from './ch.js'
import {SongVerseBisInit, SongVerse} from './verse.js'
import {SongBodyInit} from './songbody.js';
import {createSongBody} from './songbody.js';
import {Sanitize} from './sanitize.js';
import {Save} from './save.js';
import {removeAllChildren} from './utils.js';

export class SongEditor extends HTMLElement {
  constructor() {
    super();

    const template = document.createElement('template');
    template.innerHTML = `
<link rel="stylesheet" href="song.css"/>
<div style="width: fit-content;">
  <div class="toolbar">
    <div>Pliki:</br>
      <button id="buttonNew">Nowy</button>  
      <input  id="open" type="file" accept=".xml"/>
      <button id="buttonSave">Zapisz</button>  
    </div>
    <div>Formatowanie:
      <button id="buttonBis">BIS</button>
      <button id="importantOver">Kluczowe akordy</button>
      <button id="buttonInstr">Wers instrumentalny</button>
    </div>    
  </div>
  <slot id="song-body"/>
</div>
  `;

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.appendChild(template.content.cloneNode(true));

    this.buttonNew=shadow.getElementById("buttonNew");
    this.buttonBis=shadow.getElementById("buttonBis");
    this.importantOver=shadow.getElementById("importantOver");
    this.buttonInstr=shadow.getElementById("buttonInstr");
    this.buttonSave=shadow.getElementById("buttonSave");
    this.open=shadow.getElementById("open");

    this.buttonBis.addEventListener("click", (e) => this.body().wrapBis());
    this.importantOver.addEventListener("click", (e) => { this.body().markImportantOver(); this.refreshToolbar(); });
    this.buttonInstr.addEventListener("click", (e) =>  { this.body().toggleInstrumental(); this.refreshToolbar(); });
    this.buttonSave.addEventListener("click", () => Save(this.body()));
    this.open.addEventListener("change", (e) => this.Load(e));
    this.buttonNew.addEventListener("click", (e) => this.New(e));

    document.addEventListener('selectionchange', (event) => { this.refreshToolbar(); });
  }

  body() {
    return this.getElementsByTagName("song-body")[0];
  }

  New() {
    this.innerHTML=`
<song-body contenteditable='true'>
  <song-verse type='verse'><song-rows>
     <song-row>Herbata stygnie, zapada zmrok</song-row>
     <song-row>A pod piórem ciągle nic...</song-row></song-rows>
  </song-verse></song-body>`;
    Sanitize(this.body());
    this.body().selectAll();
  }

  Load(e) {
    console.log("LOADING", e);
    let parser = new DOMParser();

    // setting up the reader
    var reader = new FileReader();
    reader.addEventListener('load', (event) => {
      let parser = new DOMParser();
      let xmlDoc = parser.parseFromString(event.target.result, "text/xml");
      let z=xmlDoc.getElementsByTagName("lyric");
      removeAllChildren(this);
      let tmp= document.createElement("div");
      tmp.appendChild(z[0]);
      Sanitize(tmp);
      this.appendChild(tmp.childNodes[0]);
    });
    reader.readAsText(this.open.files[0]);
  }

  refreshToolbar() {
    if (this.body().allSelectedImportant()) {
      this.importantOver.innerText='Mało ważne akordy';
    } else {
      this.importantOver.innerText='Kluczowe akordy';
    }
    if (this.body().allSelectedInstrumental()) {
      this.buttonInstr.innerText='Wers liryczny';
    } else {
      this.buttonInstr.innerText='Wers instrumentalny';
    }
    this.buttonBis.disabled = document.getSelection().rangeCount==0;
  }

  connectedCallback() {
    if (!this.body()) {
      this.New();
    }
  }

}



function songEditorInit() {
  customElements.define("song-editor", SongEditor);
}

function init() {
  SongChInit();
  SongVerseBisInit();
  SongBodyInit();
  songEditorInit();
}

init();