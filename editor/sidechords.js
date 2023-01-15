// import {findAncestor, nbsp} from "./utils.js";
//
// const predefinedChords = ["A", "A2", "A4", "A7", "A7+", "A7/4", "A7/6", "Ais",
//     "B", "C", "C0", "C7", "C7+", "C9", "C9/5", "Cis", "Cis0", "D", "D2", "D4",
//     "D7", "D7+", "Dis", "E", "E0", "E5+", "E7", "E7/4", "F", "F0", "F7", "F7+",
//     "Fis", "Fis0", "Fis7", "G", "G0", "G6", "G7", "GC", "Gis", "H", "H6/7", "H7",
//     "a", "a6", "a7", "a7+", "a7/9", "ais", "b", "c", "cis", "cis7", "d", "d2",
//     "d6", "e", "e7", "e9", "f", "fis", "fis7", "g", "gis", "gis7", "h", "h0",
//     "h7", "h7/5-"];

//const sidechordstemplate = document.createElement('template');

import {getChordsFromRow, getSideChordsForRow, setSideChordsForRow} from "./verse.js";
import {nbsp} from "./utils.js";

const template = document.createElement('template');

export default class SideChordsRow extends HTMLElement {
    constructor() {
        super();

        const shadow = this.attachShadow({mode: "closed"});
        shadow.appendChild(template.content.cloneNode(true));

        // this.chordsType = shadow.getElementById("chords_type");
        this.selectType = shadow.getElementById("select_type");
        this.chinput = shadow.getElementById("sch");
        // this.chordsType.addEventListener("click", () => {
        //     this.chordsType.style.display = "none";
        //     this.selectType.hidden=false;
        //     this.selectType.style.display = "inline";
        // });
        this.selectType.addEventListener("change", () => {
            this.pushRowType();
        });
        this.chinput.addEventListener("change", () => {
            this.pushSideChords();
        })

        shadow.getElementById("sync_to_side").addEventListener("click", () => {
            this.chinput.value = getChordsFromRow(this.row);
            this.pushSideChords();
        })
    }

    setRow(row) {
        this.row = row;
    }

    connectedCallback() {
        this.loadRow();
    }

    pushRowType() {
        switch (this.selectType.value) {
            case "important":
                this.row.setAttribute('important_over', 'true');
                break;
            case "available":
                this.row.setAttribute('important_over', 'false');
                break;
            case "never":
                this.row.setAttribute('important_over', 'never');
                break;
        }
    }

    pushSideChords() {
        setSideChordsForRow(this.row, this.chinput.value.trim())
        this.refreshSync()
    }

    loadRow() {
        this.chinput.value = getSideChordsForRow(this.row);
        let impOver = this.row.getAttribute("important_over");
        if (impOver == "true") {
            this.selectType.value = "important"
        } else if (impOver == "false" || !impOver || impOver.trim() == "") {
            this.selectType.value = "available"
        }
        if (impOver == "never") {
            this.selectType.value = "never"
        }
        this.pushSideChords()
    }

    normalizeChords(ch) {
        return ch
            .trim()
            .replaceAll(nbsp, "").replaceAll(" ", "")
            .replaceAll("(", "").replaceAll(")", "")
            .replaceAll("[", "").replaceAll("]", "")
            .replaceAll("<", "").replaceAll(">", "")
            .replaceAll("|", "").replaceAll("!", "")
    }

    refreshSync() {
        if (this.normalizeChords(this.chinput.value) === this.normalizeChords(getChordsFromRow(this.row))) {
            this.chinput.style.backgroundColor = '#E0FFE0' // light green
        } else {
            this.chinput.style.backgroundColor = '#FFCCCB' // light red
        }
    }
}

export function SideChordsInit() {
    template.innerHTML = `
<link rel="stylesheet" href="./sidechords.css"/>
<link href="https://fonts.googleapis.com/css?family=Material+Icons|Material+Icons+Outlined|Material+Icons+Round"
      rel="stylesheet"/>
<div id="sidechords">
  <div id="type">
<!--      <span id="chords_type"  class="material-icons">auto_awesome</span>-->
      <select id="select_type">
          <option value="important">Kluczowe nad</option><!--First chorus only-->
          <option value="available">Dostępne nad</option><-- Szkoda miejsca-->
          <option value="never">Tylko z boku</option><!-- never - np. nie ustawione prawidłowo-->
      </select>
  </div>
  <input type="text" id="sch"/>
  <button class="material-icons" id="sync_to_side">keyboard_double_arrow_left</button>
</div>
  `;

    customElements.define("song-side-chords", SideChordsRow);
}