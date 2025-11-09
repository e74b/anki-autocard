import mammoth from "mammoth";
import AnkiExport from "anki-apkg-export";
import { saveAs } from "file-saver";
import { Buffer } from "buffer";

// Manual fix for anki-apkg-export
// TODO: Migrate away from this library, its 5 years old...
window.Buffer = Buffer;

const QNA_STATE_ANSWER = "Answer";
const QNA_STATE_QUESTION = "Question";

function matchQAPairs(lines) {
  let qnaPairs = [];
  let currentPair = null;
  let state = null;

  lines.forEach((line) => {
    let parts = line.split(":");
    let denotion = parts[0].trim().toLowerCase();
    let denotionLimit = line.indexOf(":") + 1;
    console.log(state, denotion, line);
    if (denotion == "q") {
      if (state == QNA_STATE_QUESTION) throw "Two questions in a row?";

      if (currentPair) qnaPairs.push(currentPair);

      state = QNA_STATE_QUESTION;
      currentPair = {};
      currentPair.question = line.substring(denotionLimit).trim();
    } else if (denotion == "a") {
      if (state == QNA_STATE_ANSWER) throw "Two answers in a row?";

      state = QNA_STATE_ANSWER;
      if (!currentPair) throw "Unexpected NULL value for currentPair!";

      currentPair.answer = line.substring(denotionLimit).trim();
    } else {
      if (!currentPair) return; // Assume this is text before a question and just skip over it.
      if (QNA_STATE_ANSWER) currentPair.answer += "\n" + line;
      else if (QNA_STATE_QUESTION) currentPair.question += "\n" + line;
    }
  });

  qnaPairs.push(currentPair);
  return qnaPairs;
}

async function getQAPairs() {
  let files = document.getElementById("file").files;
  if (files.length < 1) {
    window.alert("Please select a valid file.");
    throw "Invalid File!";
  }

  console.log(files);

  let file = files[0];
  let fileBuffer = await file.arrayBuffer();
  let textExtract = await mammoth.extractRawText({
    arrayBuffer: fileBuffer,
  });
  let rawText = textExtract.value;
  let relevantLines = [];

  rawText.split("\n").forEach((line) => {
    if (!line) return;
    relevantLines.push(line.trim());
  });
  try {
    let qaPairs = matchQAPairs(relevantLines);
  } catch {
    window.alert("Formatting error!");
    throw "Formatting error!";
  }
  return qaPairs;
  document.getElementById("files").files = [];
}

async function exportDeck(qaPairs) {
  let fileName = "Document.docx";
  const apkg = new AnkiExport.default(fileName);
  for (let pair of qaPairs) {
    console.log(pair);
    apkg.addCard(pair.question, pair.answer);
  }
  let zip = await apkg.save();
  saveAs(zip, fileName + ".apkg");
}

document.addEventListener("DOMContentLoaded", () => {
  let dropTarget = document.getElementById("drop_target");
  let btn = document.getElementById("submit_btn");
  let fileText = document.getElementById("file_text");
  let fileInput = document.getElementById("file");
  console.log(fileInput);

  fileInput.onchange = (e) => {
    if (e.target.files.length > 0) {
      if (!e.target.files[0].name.endsWith(".docx")) {
        alert("Invalid file type: only docx supported");
        let emptyDatatransfer = new DataTransfer();
        e.target.files = emptyDatatransfer.files;
        fileText.innerHTML = "Click to select a file or drop one here";
      } else {
        fileText.innerHTML = e.target.files[0].name;
      }
    } else {
      fileText.innerHTML = "Click to select a file or drop one here";
    }
  };
  fileInput.onchange({ target: fileInput });

  btn.onclick = main;

  dropTarget.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  window.addEventListener("dragover", (e) => {
    e.preventDefault();
    const fileItems = [...e.dataTransfer.items].filter(
      (item) => item.kind === "file",
    );

    if (fileItems.length > 0) {
      if (!dropTarget.contains(e.target)) {
        e.dataTransfer.dropEffect = "none";
      }
    }
  });

  window.addEventListener("drop", (e) => {
    e.preventDefault();
    document.getElementById("file").files = e.dataTransfer.files;
    main();
  });
});

async function main() {
  try {
    let qaPairs = await getQAPairs();
    await exportDeck(qaPairs);
  } catch (e) {
    console.error(e);
  }
}
