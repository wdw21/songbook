import {SongChInit} from './ch.js'
import {SongVerseBisInit, SongVerse} from './verse.js'
import {SongBodyInit} from './songbody.js';
import {createSongBody} from './songbody.js';
import {Sanitize} from './sanitize.js';
import {Save} from './save.js';
import {removeAllChildren} from './utils.js';

const attrs=["title", "text_author", "text_author_type", "artist", "artist_type",
  "alias", "original_title", "translator", "album", "composer", "composer_type",
  "music_source", "metre", "guitar_barre", "genre",
  "keywords", "comment", "done_text", "done_authors", "done_chords",
  "verificators", "todo"];

export class SongEditor extends HTMLElement {
  constructor() {
    super();

    const template = document.createElement('template');
    template.innerHTML = `
<link rel="stylesheet" href="song.css"/>
<div class="song-editor">
  <h3>Metryka</h3>
  
  <div class="metadata">
    <label for="title">Tytuł</label>              <input type="text" id="title"/>
    <label for="text_author">Autor tekstu</label> <input type="text" id="text_author"/> 
    
    <select inlist="creatortype" id="text_author_type">
      <option value=""></option>
      <option value="band">Zespół</option>
      <option value="solo">Osoba</option>  
    </select>
    
    <label for="artist">Wykonawca</label> <input id="artist" type="text"/> 
    <select inlist="creatortype" id="artist_type">
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
    
    <label for="alias">Tytuł alternatywny</label> <input type="text" id="alias"/>
    <label for="original_title">Tytuł oryginału</label> <input type="text" id="original_title"/>
    <label for="translator">Tłumacz</label> <input type="text" id="translator"/>
    <label for="album">Album</label> <input type="text" id="album"/>
        
    <label for="composer">Kompozytor</label> <input type="text" id="composer"/> 
    <select inlist="creatortype" id="composer_type">
      <option value=""></option>
      <option value="band">Zespół</option>
      <option value="solo">Osoba</option>  
    </select>
    <label for="music_source">Źródło muzyki</label> <input type="text" id="music_source"/>
    <label for="metre">Metrum</label> <input type="text" id="metre" list="metres"/>
    <label for="guitar_barre">Kapodaster</label> <input type="text" id="guitar_barre"/>

    <label for="genre">Gatunek</label> <input type="text" list="genres" id="genre"/>    
    
    <label for="keywords">Słowa kluczowe</label> <textarea id="keywords"></textarea>
    <label for="comment">Komentarz</label> <textarea id="comment"></textarea>
  </div>
  
  <h3>Status:</h3>
  <div class="metadata status">
     <label for="done_text">Sprawdzono tekst</label> <input type="checkbox" id="done_text"/>
     <label for="done_chords">Sprawdzono akordy</label> <input type="checkbox" id="done_chords"/>
       <select id="done_chords_value">
         <option value=""></option>
         <option value="chords">akordy</option>
         <option value="chord positioning">rozmieszczenie akordów</option>
       </select>
     <label for="done_authors">Sprawdzono twórców</label> <input type="checkbox" id="done_authors"/>
     <label for="verificators">Sprawdzający</label> <textarea id="verificators"></textarea>
     <label for="todo">Do zrobienia</label> <textarea id="todo"></textarea>
  </div>
</div>
<div class="toolbar">
    <div>Pliki:</br>
      <button id="buttonNew">Nowy</button>  
      <input  id="open" type="file" accept=".xml"/>
      <button id="buttonSave">Zapisz</button>  
    </div>
    <div class="formatting">Formatowanie:
      <button id="buttonBis">BIS</button>
      <button id="importantOver">Kluczowe akordy</button>
      <button id="buttonInstr">Wers instrumentalny</button>
    </div>    
</div>
<div class="generated">
  <button id="buttonSave2">Zapisz</button>
  <h2>Wygenerowane</h2>
</div>
  `;

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.appendChild(template.content.cloneNode(true));
    this.shadow = shadow;

    this.buttonNew=shadow.getElementById("buttonNew");
    this.buttonBis=shadow.getElementById("buttonBis");
    this.importantOver=shadow.getElementById("importantOver");
    this.buttonInstr=shadow.getElementById("buttonInstr");
    this.buttonSave=shadow.getElementById("buttonSave");
    this.buttonSave2=shadow.getElementById("buttonSave2");
    this.open=shadow.getElementById("open");

    this.buttonBis.addEventListener("click", (e) => this.body().wrapBis());
    this.importantOver.addEventListener("click", (e) => { this.body().markImportantOver(); this.refreshToolbar(); });
    this.buttonInstr.addEventListener("click", (e) =>  { this.body().toggleInstrumental(); this.refreshToolbar(); });
    this.buttonSave.addEventListener("click", () => Save(this.body(), this.getAttribute("title")));
    this.buttonSave2.addEventListener("click", () => Save(this.body(), this.getAttribute("title")));
    this.open.addEventListener("change", (e) => this.Load(e));
    this.buttonNew.addEventListener("click", (e) => this.New(e));

    document.addEventListener('selectionchange', (event) => { this.refreshToolbar(); });

    for (let i=0; i<attrs.length; ++i) {
      this.mapAttribute(attrs[i]);
    }
  }

  mapAttribute(attr) {
    let a = this.shadow.getElementById(attr);
    if (a.id === "done_chords") {
      let av = this.shadow.getElementById("done_chords_value");
      let fun = (e) => {
         if (a.checked) {
           this.setAttribute("done_chords", av.value);
         } else {
           this.removeAttribute("done_chords");
         }
      }
      a.addEventListener("change", fun);
      av.addEventListener("change", fun);
    } else if (a.nodeName=='INPUT' && a.type==='checkbox') {
      a.addEventListener("change",
          (e) => this.setAttribute(attr, e.target.checked));

    } else {
      a.addEventListener("change",
          (e) => this.setAttribute(attr, e.target.value));
    }
  }

  attributeChangedCallback(attr) {
    let a = this.shadow.getElementById(attr);
    if (a.id === "done_chords") {
      a.checked = this.hasAttribute("done_chords");
      this.shadow.getElementById("done_chords_value").value = a.checked
          ? this.getAttribute("done_chords") : "";
    } else if (a.nodeName=='INPUT' && a.type==='checkbox') {
      a.checked=this.getAttribute(attr)==="true";
    } else {
      a.value=this.getAttribute(attr);
    }
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

      let song=xmlDoc.getElementsByTagName("song")[0];

      this.setAttribute("title", song.getAttribute("title"));
      this.readAttribute(song, "text_author", "text_author");
      this.readAttribute(song, "text_author_type", "text_author", "type");
      this.readAttribute(song, "artist", "artist");
      this.readAttribute(song, "artist_type", "artist", "type");

      this.readAttribute(song, "alias", "alias");
      this.readAttribute(song, "original_title", "original_title");
      this.readAttribute(song, "translator", "translator");
      this.readAttribute(song, "album", "album");
      this.readAttribute(song, "composer", "composer");
      this.readAttribute(song, "composer_type", "composer", "type");
      this.readAttribute(song, "music_source", "music_source");

      this.readAttribute(song, "metre", "music","metre");
      this.readAttribute(song, "guitar_barre", "guitar", "barre");
      this.readAttribute(song, "genre", "genre");
      this.readAttribute(song, "comment", "comment");

      this.readAttributeDone(song, "done_text", "text");
      this.readAttributeDone(song, "done_authors", "authors");
      this.readAttributeDone(song, "done_chords", "chords");

      this.readAttributeList(song, "keywords", "keyword");
      this.readAttributeList(song, "verificators", "verificator");

      this.readAttribute(song, "todo", "todo");
    });
    reader.readAsText(this.open.files[0]);
  }

  readAttribute(song, targetAttr, sourceTagName, sourceAttr=null) {
    let nodes = song.getElementsByTagName(sourceTagName);
    let node = nodes.length > 0 ? nodes[0] : null;
    let txt=null;
    if (node && !sourceAttr) {
      txt = node.textContent;
    } else if (node) {
      txt = node.getAttribute(sourceAttr);
    }
    if (!txt || txt.trim()=='') {
      this.removeAttribute(targetAttr);
    } else {
      this.setAttribute(targetAttr, txt);
    }
  }

  readAttributeDone(song, targetAttr, sourceTagName) {
    let nodes = song.getElementsByTagName(sourceTagName);
    let node = nodes.length > 0 ? nodes[0] : null;
    if (node) {
      this.setAttribute(targetAttr, node.textContent.trim()==''?'true':node.textContent);
    } else {
      this.removeAttribute(targetAttr);
    }
  }

  readAttributeList(song, targetAttr, sourceTagName) {
    let nodes = song.getElementsByTagName(sourceTagName);
    let txt='';
    for (let i=0; i < nodes.length; ++i) {
      txt+=nodes[i].textContent + '\n';
    };
    if (txt && txt.trim()!='') {
      this.setAttribute(targetAttr, txt);
    }
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

  static get observedAttributes() {
    return attrs;
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