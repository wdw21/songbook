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
  
  <h3>Metryka</h3>
  
  <div class="metadata">
    <label>Tytuł</label> <input type="text"/>
    <label>Autor tekstu</label> <input type="text_author"/> 
    
    <select inlist="creatortype">
      <option value=""></option>
      <option value="band">Zespół</option>
      <option value="solo">Osoba</option>  
    </select>
    
    <label>Wykonawca</label> <input type="composer"/> 
    <select inlist="creatortype">
      <option value=""></option>
      <option value="band">Zespół</option>
      <option value="solo">Osoba</option>  
    </select>
  </div>
     
  <h3>Treść</h3>
  <slot id="song-body"></slot>
  
  <h3>Szczegóły:</h3>
  <div class="metadata">
    <datalist id="genres">
      <option>Kolęda</option>
      <option>Piosenka harcerska</option>
      <option>Piosenka kabaretowa</option>
      <option>Piosenka turystyczna</option>
      <option>Piosenka turystyczna górska</option>
      <option>Pieśń ludowa</option>
      <option>Poezja śpiewana</option>
      <option>Rock</option>
      <option>Szanta</option>
      <option>Parodia</option>
      <option>Przeróbka</option>
      <option>Inna</option>
    </datalist> 
    
    <datalist id="metres">
      <option>2/2</option>
      <option>3/3</option>
      <option>2/4</option>
      <option>3/4</option>
      <option>4/4</option>
      <option>6/8</option>
      <option>8/8</option>
      <option>12/8</option>
    </datalist>
    
    <label>Tytuł alternatywny</label> <input type="alias"/>
    <label>Tytuł oryginału</label> <input type="original_title"/>
    <label>Tłumacz</label> <input type="composer"/>
    <label>Album</label> <input type="music_source"/>
        
    <label>Kompozytor</label> <input type="composer"/> 
    <label>Źródło muzyki</label> <input type="music_source"/>
    <label>Metrum</label> <input type="metre" list="metres"/>
    <label>Kapodaster</label> <input type="guitar_barre"/>

    <label>Gatunek</label> <input type="text" list="genres" name="genere"/>    
    

    <label>Słowa kluczowe</label> <textarea type="keywords"></textarea>
    <label>Komentarz</label> <textarea></textarea>
  </div>
  
  <h3>Status:</h3>
  <div class="metadata status">
     <label>Sprawdzono tekst</label> <input type="checkbox"/>
     <label>Sprawdzono akordy</label> <input type="checkbox"/>
     <label>Sprawdzono twórców</label> <input type="checkbox"/>
     <label>Sprawdzający</label> <textarea></textarea>
     <label>Do zrobienia</label> <textarea></textarea>
  </div>
  
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
      let xmlDoc = parser.parseFromString(event.target.result.replaceAll(" style=", " type="), "text/xml");
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