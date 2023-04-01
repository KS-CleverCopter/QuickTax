/*jshint esversion: 9 */

// Closed off for added security.
function processPDF(arr, callBack, errCallBack) {
  document.getElementById("pdfArea").innerHTML = "";
  var ccutil, xmlToHtml;
  class CCUtilities {
    constructor() {}
    normaliseWord(word) {
      if (word) {
        return word.toLowerCase().replace(/ /g, "").trim();
      }
    }
    createElement(opts) {
      if (!opts) {
        console.error("Options missing for createelement");
        return;
      }
      var svgElms = [
        "path",
        "polyline",
        "g",
        "circle",
        "rect",
        "text",
        "line",
        "svg",
        "foreignObject",
      ];
      var elm = document.getElementById(opts.id);
      if (opts.id && elm) {
        // Resuse the element if it exists already;
        elm = document.getElementById(opts.id);
      } else {
        // Create a new element since it doesnt already exist in DOM;
        if (svgElms.indexOf(opts.type) >= 0) {
          var ns = "http://www.w3.org/2000/svg";
          elm = document.createElementNS(ns, opts.type);
        } else {
          elm = document.createElement(opts.type);
        }
      }

      if (opts.attrs) {
        for (var a in opts.attrs) {
          if (a) {
            elm.setAttribute(a, opts.attrs[a]);
          }
        }
      }
      return elm;
    }
    makeHTTPRequest(opts, callBack) {
      var path = opts.path;
      var data = opts.data || {};
      var type = opts.type || "GET";
      var docType = opts.docType || "normal";
      let httpRequest = new XMLHttpRequest();

      if (!httpRequest) {
        return false;
      }
      httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState === XMLHttpRequest.DONE) {
          if (httpRequest.status === 200) {
            if (callBack) {
              if (docType == "xml") {
                callBack.call(this, httpRequest.responseXML);
              } else {
                callBack.call(this, httpRequest.responseText);
              }
            }
          } else {
            console.error(
              "There was a problem with the request.",
              httpRequest.status
            );
            callBack.call(this, "error");
          }
        }
      };
      httpRequest.open(type, path);
      httpRequest.send(data);
    }
  }
  class Coords extends CCUtilities {
    constructor() {
      super();
    }
    processCoords(coordsString) {
      var coords = coordsString.split(",").map((elm) => parseFloat(elm) * 2);
      return coords;
    }
  }
  class XMLToHTML extends Coords {
    constructor() {
      super();
      this.rects = null;
      this.rawXML = null;
      this.htmlContainer = document.getElementById("pdfArea");
      this.pageheight = null;
      this.textLines = null;
      this.rectBoxes = [];
      this.textLineBoxes = [];
      this.textLineHeight = null;
      this.boxElms = [];
    }
    process(rawXML) {
      this.htmlContainer.innerHTML = "";
      this.rawXML = rawXML;
      try {
        this.pageheight =
          parseFloat(
            this.rawXML
              .getElementsByTagName("page")[0]
              .getAttribute("bbox")
              .split(",")[3]
          ) * 2;
      } catch (e) {
      }
      this.drawRects();
    }
    drawRects() {
      this.rects = this.rawXML.getElementsByTagName("rect");
      let rl = this.rects.length;
      this.textLines = this.rawXML.getElementsByTagName("textline");
      let elms = [...this.rects, ...this.textLines];
      var firstTextCoords = this.processCoords(
        this.textLines[0].getAttribute("bbox")
      );
      this.textLineHeight = Math.abs(firstTextCoords[1] - firstTextCoords[3]);
      if (this.textLineHeight > 20 || this.textLineHeight < 15) {
        this.textLineHeight = 19;
      }

      for (var i = 0; i < elms.length; i++) {
        let obj = elms[i];
        let textLines = false;
        if (i >= rl) {
          textLines = true;
        }
        if (obj) {
          let coords = this.processCoords(obj.getAttribute("bbox"));
          let h = Math.abs(coords[1] - coords[3]);
          if (textLines) {
            let div = this.createDiv({
              coords: coords,
              attrs: {
                class: `boundingBox ${textLines ? "textLines" : ""} pdfElms`,
              },
            });
            this.textLineBoxes.push(div);
          } else {
            if (h >= this.textLineHeight - 3 && h <= this.textLineHeight + 3) {
              let div = this.createDiv({
                coords: coords,
                attrs: {
                  class: `boundingBox ${
                    textLines ? "textLines" : "rectBoxes"
                  } pdfElms`,
                },
              });
              this.rectBoxes.push(div);
            }
          }
        }
      }
      this.rectBoxes = this.rectBoxes.filter((obj) => {
        // filtering out only the rect boxes that are tabular based on its yFlat.
        let matchingYFlatElms = document.querySelectorAll(
          `[yFlat='${obj.getAttribute("yFlat")}']`
        );
        if (matchingYFlatElms.length >= 9) {
          obj.classList.add("tabularElm");
          return true;
        }
        return false;
      });
      this.boxElms = [...this.rectBoxes, ...this.textLineBoxes];
      this.mapText();
      this.drawBoundingRects();
      this.convertIndLetterToWords();
      extract.extractTable();
      extract.extractHorizontalAndVerticals();
    }
    drawBoundingRects() {
      var rows = {};

      document.querySelectorAll(".pdfElms").forEach((obj) => {
        let yFlat = obj.getAttribute("yFlat");
        if (!rows[yFlat]) {
          rows[yFlat] = [];
        }
        rows[yFlat].push(obj);
      });
      for (var r in rows) {
        let row = ccutil.createElement({
          type: "div",
          attrs: {
            yFlatRow: r,
            class: "yFlatRow",
          },
        });

        let top = null;
        let height = null;
        for (var e = 0; e < rows[r].length; e++) {
          // let elm = rows[r][e].remove();
          if (!top) {
            top = rows[r][e].getAttribute("yFlat");
            height = rows[r][e].style.height;
          }
          rows[r][e].style.top = "initial";
          row.appendChild(rows[r][e]);
        }
        row.style.height = height;
        row.style.top = top + "px";
        row.style.left = 0;
        this.htmlContainer.appendChild(row);
      }
    }
    convertIndLetterToWords() {
      // Converts individual letters to words.
      var newWordWrapper = (row) => {
        let wr = ccutil.createElement({
          type: "div",
          attrs: {
            class: "wordWrapper",
            rowYFlat: row.getAttribute("yFlatRow"),
          },
        });
        row.appendChild(wr);
        return wr;
      };
      let diffThreshold = 12;

      document.querySelectorAll(".yFlatRow").forEach((row, i) => {
        let wordWrapper = newWordWrapper(row);
        let pat = `[yflatrow='${row.getAttribute("yFlatRow")}'] .txt`;
        let childNodes = document.querySelectorAll(pat);
        let titleBox = false;
        for (var c = 0; c < childNodes.length; c++) {
          let cn = childNodes[c];
          let posX = null;
          if (cn.classList.contains("txt") && c > 0) {
            // Adding a wider spacing for title letters, because they sometime can be very wide. e.g. 'N o t a   C o r r a t ..'
            if (
              cn.getAttribute("font") === "Times-Bold" &&
              parseFloat(cn.getAttribute("fontsize")) > 11.0
            ) {
              cn.classList.add("titleBox");
              titleBox = true;
              diffThreshold = 17;
            } else {
              diffThreshold = 12;
            }
            let prevX = parseFloat(childNodes[c - 1].getAttribute("x"));
            let curX = parseFloat(cn.getAttribute("x"));
            let diff = Math.abs(prevX - curX);
            let prevLetter = childNodes[c - 1].innerHTML;
            if (prevLetter == "W" || prevLetter == "M") {
              // Since W is wide letter, adding two pixels as buffer. This way W doesnt get unfaily dropped as a new word.
              if (diff > diffThreshold + 1) {
                // New word
                wordWrapper = newWordWrapper(row);
              }
            } else {
              if (diff > diffThreshold) {
                // New word
                wordWrapper = newWordWrapper(row);
              }
            }
          }
          wordWrapper.appendChild(cn);
          if (titleBox) {
            wordWrapper.classList.add("titleBox");
          }
          let value = wordWrapper.getAttribute("value") || "";
          let newValueSnippent = cn.innerHTML;
          wordWrapper.setAttribute("font", cn.getAttribute("font"));
          wordWrapper.setAttribute("value", value + newValueSnippent);
          if (wordWrapper.style.left == "" || wordWrapper.style.left == " ") {
            wordWrapper.style.left = cn.style.left;
            wordWrapper.setAttribute("x", cn.style.left);
          }
        }
      });
      document.querySelectorAll(".wordWrapper").forEach((wr) => {
        let v = wr.getAttribute("value");
        if (v) {
          let r$ = v.split("R$");
          wr.setAttribute("value", r$[0]);
          wr.setAttribute("key", this.normaliseWord(r$[0]));
          let iss = v.replace("*", "").split("ISS ");
          if (iss.length > 1) {
            wr.setAttribute("value", "ISS");
            wr.setAttribute("key", this.normaliseWord("ISS"));
          }
        }
      });
    }
    createDiv(opts) {
      let coords = opts.coords;
      let w = Math.abs(coords[0] - coords[2]);
      let h = Math.abs(coords[1] - coords[3]);
      let x = coords[0];
      let y = coords[1];
      let x1 = coords[2];
      let y1 = coords[3];
      let t = this.pageheight - coords[3];
      let top = Math.floor(t / 5) * 5;
      var div = ccutil.createElement({
        type: "div",
        attrs: {
          style: `width:${w}px;height:${h}px;left:${x}px;top:${top}px`,
          x,
          y,
          x1,
          y1,
          ...opts.attrs,
          yFlat: top,
        },
      });
      this.htmlContainer.appendChild(div);
      return div;
    }
    mapText() {
      for (var i = 0; i < this.textLines.length; i++) {
        let textNodes = this.textLines[i].childNodes;
        for (let t = 0; t < textNodes.length; t++) {
          if (textNodes[t].nodeType == 1) {
            const element = textNodes[t];
            var bboxString = element.getAttribute("bbox");
            if (bboxString && bboxString != "") {
              let coords = this.processCoords(bboxString);
              var homeElm = this.findHome(coords);
              if (homeElm) {
                homeElm.style.fontSize =
                  parseInt(element.getAttribute("size")) * 1.6 + "px";
                let div = this.createDiv({
                  coords: this.processCoords(textNodes[t].getAttribute("bbox")),
                  attrs: {
                    class: "txt pdfElms",
                    fontSize: element.getAttribute("size"),
                    font: element.getAttribute("font"),
                  },
                });
                div.innerHTML = textNodes[t].textContent;
              }
            }
          }
        }
        this.textLines[i].setAttribute("filled", "true");
      }
    }
    findHome(coordsArr) {
      let potentialBox = [];
      let potentialRectBox = [];
      for (var x = 0; x < this.textLineBoxes.length; x++) {
        var box = this.textLineBoxes[x];
        var boxX = parseInt(box.getAttribute("x"));
        var boxY = parseInt(box.getAttribute("y"));
        var boxX1 = parseInt(box.getAttribute("x1"));
        var boxY1 = parseInt(box.getAttribute("y1"));
        var cx = coordsArr[0];
        var cy = coordsArr[1];
        if (cx >= boxX && cx <= boxX1 && cy >= boxY && cy <= boxY1) {
          potentialBox.push(box);
        }
      }
      for (var r = 0; r < this.rectBoxes.length; r++) {
        var rbox = this.rectBoxes[r];
        var rboxX = parseInt(rbox.getAttribute("x"));
        var rboxY = parseInt(rbox.getAttribute("y"));
        var rboxX1 = parseInt(rbox.getAttribute("x1"));
        var rboxY1 = parseInt(rbox.getAttribute("y1"));
        var rcx = coordsArr[0];
        var rcy = coordsArr[1];
        if (rcx >= rboxX && rcx <= rboxX1 && rcy >= rboxY && rcy <= rboxY1) {
          potentialRectBox.push(rbox);
        }
      }
      if (potentialRectBox.length > 0) {
        return potentialRectBox[0];
      } else {
        return potentialBox[0];
      }
    }
  }
  class Extract extends CCUtilities {
    constructor() {
      super();
      this.tableColumns = ["Negociação", "Q", "Prazo", "Quantidade", "D/C"]; // if any HTML row contains more than two values that are part of a table. Consider that HTML row a table's row
      this.minColsForTable = 7; // was 7 previously
      this.currentCols = 0;
      this.pdfTitleKeys = null;
      this.titleRow = null;
      this.titleRowYflatRow = null;
      this.sortedRows = null;
      this.allRows = [];

      this.otherKeysToExtract = null;
      this.result = {
        table: [],
        others: [],
      };
    }
    set titleKeys(val) {
      this.pdfTitleKeys = val;
      this.pdfTitleKeys = this.pdfTitleKeys.map((obj) => {
        obj = this.normaliseWord(obj);
        return obj;
      });
    }
    set keysToExtract(val) {
      this.otherKeysToExtract = val;
      this.otherKeysToExtract = this.otherKeysToExtract.map((obj) => {
        obj = this.normaliseWord(obj);
        return obj;
      });
    }

    numberofTableColumnsInRow(cols) {
      let match = 0;
      cols.forEach((col) => {
        let val = col.getAttribute("value");
        if (this.tableColumns.indexOf(val) >= 0) {
          match++;
        }
      });
      return match;
    }

    extractTable() {
      // Table has a minimum of 7-8 columns, and that will be the key to indentifying div as a table-row.

      // Getting all rows
      let result = {};
      let allRows = document.querySelectorAll(".yFlatRow");
      let tableRows = [];
      // Extract only the table rows.

      allRows.forEach((row) => {
        // Identify rows with a min of 7 cols.
        let identifier = row.getAttribute("yflatrow");
        let cols = document.querySelectorAll(
          `[yflatrow='${identifier}'] .wordWrapper:not(.titleBox)`
        );

        let colsArr = [];

        cols.forEach((col) => {
          colsArr.push({
            col: col,
            x: parseFloat(col.getAttribute("x")),
            value: col.getAttribute("value"),
          });
        });
        this.allRows.push({
          row: row,
          cols: colsArr,
          rowYFlat: parseInt(identifier),
        });

        if (this.numberofTableColumnsInRow(cols) > 2) {
          this.titleRow = cols;
          this.titleRowYflatRow = parseInt(row.getAttribute("yflatrow"));
          tableRows.push({
            row: row,
            cols: colsArr,
            rowYFlat: parseInt(identifier),
          });
          if (!this.currentCols) {
            this.currentCols = cols.length;
          }
        }
      });

      allRows.forEach((row) => {
        let identifier = row.getAttribute("yflatrow");
        let cols = document.querySelectorAll(
          `[yflatrow='${identifier}'] .wordWrapper`
        );
        let colsArr = [];

        cols.forEach((col) => {
          let colX = parseInt(col.getAttribute("x")).toString();
          colsArr.push({
            col: col,
            x: parseFloat(col.getAttribute("x")),
            value: col.getAttribute("value"),
            yFlat: identifier,
          });
        });

        if (
          Object.keys(colsArr).length > this.minColsForTable &&
          parseInt(identifier) > this.titleRowYflatRow
        ) {
          tableRows.push({
            row: row,
            cols: colsArr,
            rowYFlat: parseInt(identifier),
          });
        }
      });

      // Sort row' yFlat in ascending order so that the header is always the first row.
      tableRows.sort((a, b) => {
        if (a.rowYFlat > b.rowYFlat) {
          return 1;
        } else if (a.rowYFlat == b.rowYFlat) {
          return 0;
        } else {
          return -1;
        }
      });

      // Sort Cols based on X
      tableRows.forEach((row) => {
        let cols = row.cols;
        if (cols && cols.length) {
          cols.sort((a, b) => {
            if (a.x > b.x) {
              return 1;
            } else if (a.x == b.x) {
              return 0;
            } else {
              return -1;
            }
          });
        }
      });

      // add missing columns to title
      let xArray = [];
      let titleKeys = {};
      this.titleRow.forEach((obj) => {
        let xVal = parseInt(obj.getAttribute("x"));
        titleKeys[xVal] = obj.getAttribute("value");
        titleKeys[xVal] = {
          value: obj.getAttribute("value"),
          x: xVal,
        };
        xArray.push(xVal);
      });
      xArray.sort((a, b) => {
        return a > b;
      });

      let tableResult = {};
      // Removes the title Row;
      tableRows.shift();
      tableRows.forEach((_row, ti) => {
        let colKeys = Object.keys(_row.cols).map((obj) => {
          return parseInt(obj);
        });
        colKeys.sort((a, b) => {
          return a > b;
        });
        let titleRowClone = xArray.map((obj) => {
          return {
            x: parseInt(obj),
            value: "",
          };
        });
        let lastX = titleRowClone[titleRowClone.length - 1].x;
        let colsClone = [..._row.cols];
        let matchedCols = [];

        do {
          let detachedCol = colsClone.shift();
          let colsX = parseInt(detachedCol.x);
          let tLen = titleRowClone.length;
          for (let t = 0; t < tLen; t++) {
            const x = titleRowClone[t].x;
            const x1 = t == tLen - 1 ? lastX + 20 : titleRowClone[t + 1].x;
            if (colsX >= x && colsX < x1) {
              // match Found
              matchedCols[t] = detachedCol.value;
              if (titleRowClone[t].hasOwnProperty("yFlat")) {
                titleRowClone[t].value += " " + detachedCol.value;
              } else {
                titleRowClone[t] = {
                  x,
                  value: detachedCol.value,
                  yFlat: detachedCol.yFlat,
                };
              }
              break;
            }
          }
        } while (colsClone.length);

        titleRowClone.sort((a, b) => {
          return a.x > b.x;
        });
        this.titleRow.forEach((obj, i) => {
          let tX = parseInt(obj.getAttribute("x"));
          titleRowClone.map((tObj) => {
            if (tObj.x == tX && !tObj.hasOwnProperty("key")) {
              tObj.key = obj.getAttribute("value");
            }
          });
        });
        // Check for Duplicate keys Code Here.
        //Add code here
        tableResult[titleRowClone[1].yFlat.toString()] = titleRowClone.map(
          (u) => ({ key: u.key, value: u.value })
        );
      });

      this.result.table.push(tableResult);
    }
    extractHorizontalAndVerticals() {
      let result = {};
      for (let i = 0; i < this.otherKeysToExtract.length; i++) {
        let elms;

        /* There are two clearings, one at the top and another at the bottom. The result required is that of the bottom one as per the Client.
        Therefore ignoring the top Clearing by identifying it through its font type. This fix is applicable only for the clearing field; KS.
        */
        if (this.otherKeysToExtract[i] !== "clearing") {
          elms = document.querySelectorAll(
            `[key = '${this.otherKeysToExtract[i]}' ]:not([font*='TimesNewRomanNegrito'])`
          );
        } else if (this.otherKeysToExtract[i] === "clearing") {
          elms = document.querySelectorAll(
            `[key = '${this.otherKeysToExtract[i]}' ]:not([font*='TimesNewRomanNegrito']):not([font*='Helvetica-Bold']):not([font*='Times-Bold'])`
          );
        }
        let elmYFlat = null;
        let closestCol = null;
        let closestCols = [];
        for (let e = 0; e < elms.length; e++) {
          const elm = elms[e];
          if (elm) {
            elmYFlat = parseInt(elm.parentNode.getAttribute("yFlatRow"));
            var elmX = parseInt(elm.getAttribute("x"));
            let closestFound = false;
            for (let r = 0; r < this.allRows.length; r++) {
              const rowObj = this.allRows[r];

              let rowY = parseInt(rowObj.row.getAttribute("yflatrow"));
              let offset = 5;
              let offsetLower = elmYFlat - offset;
              let offsethigher = elmYFlat + offset;

              // offsethigher
              if (rowY >= offsetLower) {
                for (let c = 0; c < rowObj.cols.length; c++) {
                  // This if condition will prevent columns with the same value as the title.
                  if (
                    this.normaliseWord(
                      rowObj.cols[c].col.getAttribute("value")
                    ) !== this.otherKeysToExtract[i]
                  ) {
                    const rowCol = rowObj.cols[c].col;
                    const rowColX = parseFloat(rowCol.getAttribute("x"));

                    let rowColValue = rowCol.getAttribute("value");

                    if (rowColValue) {
                      rowColValue = this.normaliseWord(rowColValue);

                      if (
                        this.pdfTitleKeys.indexOf(rowColValue) < 0 &&
                        rowColX > elmX
                      ) {
                        closestCols.push({
                          x: rowColX,
                          y: rowY,
                          col: rowCol,
                          value: rowCol.getAttribute("value"),
                        });

                        if (!closestCol) {
                          closestCol = {
                            x: rowColX,
                            col: rowCol,
                          };
                        } else {
                          if (rowColX < closestCol.x) {
                            closestCol = {
                              x: rowColX,
                              col: rowCol,
                            };
                          }
                        }
                        closestFound = true;
                      }
                    }
                  }
                }
                if (closestFound) {
                  break;
                }
              }
            }
            closestCols.sort((a, b) => {
              if (a.x > b.x) {
                return 1;
              } else if (a.x == b.x) {
                return 0;
              } else {
                return -1;
              }
            });

            let xDiffAverage = 0;
            if (closestCols.length > 0) {
              xDiffAverage =
                (closestCols[closestCols.length - 1].x - closestCols[0].x) /
                closestCols.length; // moved to inside closesCols.length > 0 if on 29th may

              var elmValue = elm.getAttribute("value").trim(); // added on
              let offset = 5;
              let rowY = closestCols[0].y;
              if (rowY >= elmYFlat - offset && rowY <= elmYFlat + offset) {
                closestCols.forEach((obj) => {
                  let v = obj.value == " " ? "" : obj.value;
                  if (v.trim() == "D" || v.trim() == "C") {
                    v = "|" + v;
                  }
                  if (result[elmValue] == "" || !result[elmValue]) {
                    result[elmValue] = v;
                  } else {
                    if (
                      this.otherKeysToExtract[i] == "i.r.r.f.s/operações,base"
                    ) {
                      if (v.indexOf("D") >= 0 || v.indexOf("C") >= 0) {
                        result[elmValue] += v;
                      } else {
                        result[elmValue] = v;
                      }
                    } else {
                      result[elmValue] += v;
                    }
                  }
                });
              } else {
                if (closestCols[0].y != elmYFlat) {
                  let v =
                    closestCols[0].value == " " ? null : closestCols[0].value;
                  if (v == "CONTINUA...") {
                    v = null;
                  }
                  result[elmValue] = v;
                } else if (xDiffAverage > 30) {
                  let v =
                    closestCols[0].value == " " ? null : closestCols[0].value;
                  if (v == "CONTINUA...") {
                    v = null;
                  }
                  result[elmValue] = v;
                } else {
                  closestCols.forEach((obj) => {
                    let v = obj.value == " " ? "" : obj.value;
                    if (v.trim() == "D" || v.trim() == "C") {
                      v = "|" + v;
                    }
                    if (result[elmValue] == "" || !result[elmValue]) {
                      result[elmValue] = v;
                    } else {
                      //
                      result[elmValue] += v;
                    }
                  });
                }
              }
            }
          }
        }
      }
      // get closest Y.
      if (this.result && this.result.others) {
        this.result.others.push(result);
      }
      callBack.call(this, { input: arr, result: this.result });
    }
  }
  ccutil = new CCUtilities();
  ccutil.makeHTTPRequest(
    {
      path: arr,
      docType: "xml",
    },
    (res) => {
      if (res == "error") {
        errCallBack.call(this, "error");
      } else {
        xmlToHtml = new XMLToHTML();
        extract = new Extract();
        extract.titleKeys = [
          "XPINVESTIMENTOS CCTVMS/A",
          "Nr. nota",
          "Nr.Nota", // added on 29th may
          "Folha",
          "Data pregão",
          "XPINVESTIMENTOS CCTVMS/A",
          "AV ATAULFO DE PAIVA, 153 - SALA 201 LEBLON",
          "Cliente",
          "C.P .F./C.N.P .J/C.V.M./C.O.B.",
          "Código cliente",
          "Assessor",
          "Participante destino do repasse",
          "Cliente",
          "Valor",
          "Custodiante",
          "Assessor",
          "Banco",
          "Agência",
          "Conta corrente",
          "Acionista",
          "Administrador",
          "Complemento nome",
          "P. Vinc",
          "Q",
          "Negociação",
          "c/v",
          "Tipo mercado",
          "Prazo",
          "Especificação do título",
          "Obs",
          "Obs.(*)",
          "Obs. (*)",
          "Quantidade",
          "Preço / Ajuste",
          "Valor Operação / Ajuste",
          "D/C",
          "Resumo dos Negócios",
          "Debêntures",
          "Vendas à vista, Compras à vista",
          "Opções - compras",
          "Opções - vendas",
          "Operações à termo",
          "Valor das oper. c/ títulos públ. (v. nom.)",
          "Valor das operações",
          "Clearing",
          "Valor líquido das operações",
          "Taxa de liquidação",
          "Taxa de Registro",
          "Total CBLC ",
          "Bolsa",
          "Taxa de termo/opções",
          "Taxa A.N.A.",
          "Emolumentos",
          "Total Bovespa / Soma ",
          "Custos Operacionais",
          "Taxa Operacional",
          "Execução",
          "Taxa de Custódia",
          "Impostos",
          "I.R.R.F. s/ operações, base",
          "Outros",
          "Líquido para",
          "Total Custos / Despesas",
          "CodigodoCliente",
          "Nota de Corratagem",
          "Corretora",
          "NumerodaCorretora",
          "Totalliquido(#)",
          "Vendadisponíve",
          "Vendadisponível",
          "Venda disponível",
          "Compradisponíve",
          "Compra disponível",
          "Venda Opções",
          "VendaOpçõe",
          "CompraOpções",
          "Compra Opções",
          "Valordosnegócios",
          "IRRF",
          "IRRFDayTrade(proj.)",
          "Taxaoperaciona",
          "TaxaregistroBM&F",
          "TaxasBM&F(emol+f.gar)",
          "+OutrosCustos",
          "Ajustedeposição",
          "Ajustedaytrade",
          "Totaldasdespesas",
          "Totallíquidodanota",
          "Totalliquido(#)",
          "TotalContaNormal",
          "TotalContaInvestimento",
          "IRRF Corretagem",
          "Outros",
          "Taxa operacional",
          "Taxa registroBM&amp;F",
          "Taxa registro BM&F",
          "Taxas BM&amp;F(emol+f.gar)",
          "C.N.P.J.",
          "XP InvestimentosCCTVMS/A",
          "Corretora",
          "I.S.S",
          "ISS",
          "OutrasBovespa",
          "Total Conta Investimento",
          "C.N.P.J/C.P.F",
          "Vendas à vista",
          "Compras à vista",
          "Opções - compras",
          "Opções - vendas",
          "Operações à termo",
          "Valor das oper. c/ títulos públ. (v. nom.)",
          "Valor das operações",
          "Corretagem / Despesas",
          "Total Bovespa / Soma ",
          "Totalcorretagem/Despesas",
          "Observação:  (1) As operações a termo não são computadas no líquido da fatura",
          "________________________________________________",
          "Valorlíquidodasoperações",
          "SAFRA CORRETORA DE VALORES E CÂMBIO LTDA.",
          "Execução casa",
        ];
        extract.keysToExtract = [
          "Nr. nota", // Type1
          "Nr.Nota", // added on 29th may
          "Data pregão", // Type1
          "Taxa operacional", // Type1
          "Taxa registro BM&amp;F", // Type1
          "Taxas BM&amp;F (emol+f.gar)", // Type1
          "I.S.S", // Type1
          "ISS", // Type1
          "Total das despesas", // Type1
          "Outros", // Type1
          "Taxa de liquidação", // Type2
          "Taxa de Registro", // Type 2
          "Emolumentos", // Type 2
          "Clearing", // Type 2
          "I.R.R.F. s/ operações, base", // Type 2
          "Outras Bovespa", // Type 2
          "Outras", // Type 2
          "Valor das operações",
          "C.P.F./C.N.P.J/C.V.M./C.O.B.",
          "C.P.F./C.N.P.J./C.V.M./C.O.B.",
          "C.N.P.J/C.P.F",
          "Impostos",
          "Corretagem",
          "e-mail",
          "Cliente",
        ];
        xmlToHtml.process(res);
      }
    }
  );
}

function looper(arrStr) {
  let arr = arrStr.split(",");
  let output = [];
  let resCount = 0;
  document.getElementById("outputStatus").innerHTML = "processing";
  arr.forEach((ar) => {
    processPDF(
      ar,
      (res) => {
        resCount++;
        output.push(res);
        if (resCount == arr.length) {
          document.getElementById("outputStatus").innerHTML = "completed";
          document.getElementById("output").innerHTML = JSON.stringify(output);
          let stringJSON = JSON.stringify(output);
          let printElm = document.getElementById("printRes");
          for (var opt in output) {
            let parsedStringJSON = output[opt].result;
            printElm.innerHTML += ` <hr/> ${output[opt].input} <br />`;
            printElm.innerHTML += ` <embed width='100%' height='1000px' src="${output[
              opt
            ].input.replace("xml", "pdf")}" width="900" height="400px" />`;
            for (var obj in parsedStringJSON) {
              printElm.innerHTML += `<div class='levelOne'>${obj}</div>`;
              for (var ob in parsedStringJSON[obj]) {
                for (var key in parsedStringJSON[obj][ob]) {
                  if (obj == "table") {
                    for (var ky in parsedStringJSON[obj][ob][key]) {
                      printElm.innerHTML += `<div class='levelTwo'>${JSON.stringify(
                        parsedStringJSON[obj][ob][key][ky]
                      )}</div>`;
                    }
                  } else {
                    if (key === "Taxa Operacional") {
                      parsedStringJSON[obj][ob].Clearing =
                        parsedStringJSON[obj][ob][key];
                    }
                    if (key === "Nr.Nota") {
                      parsedStringJSON[obj][ob]["Nr. nota"] =
                        parsedStringJSON[obj][ob][key];
                      key = 'Nr. nota';
                    }
                    printElm.innerHTML += `<div class='levelTwo'><strong>${key}</strong> : ${parsedStringJSON[obj][ob][key]}</div>`;
                  }
                }
              }
            }
          }
          // Test
          document.getElementById("pdfArea").style.opacity = 1;
        }
      },
      (err) => {
        resCount++;
      }
    );
  });
}
