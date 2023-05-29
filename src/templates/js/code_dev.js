let language = document.getElementById("language").value;
let indentType = document.getElementById("indentType").value;
let indentUnit = parseInt(document.getElementById("indentUnit").value);
let modeName, scriptPath;
let editor;

if (typeof (modeName) === "undefined") {
    language = "60"
    modeName = "text/x-go";
    scriptPath = "../lib/codemirror/mode/go.js";
    indentType = false;
    import(scriptPath)
        .then((module) => {
            editor = CodeMirror.fromTextArea(document.getElementById("code"), {
                mode: {
                    name: modeName,
                    singleLineStringErrors: true
                },
                lineNumbers: true,
                indentWithTabs: indentType,
                indentUnit: indentUnit,
                matchBrackets: true,
                firstLineNumber: 0,
                smartIndent: true,
                theme: "darcula",
            });
            editor.on("keydown", function (cm, event) {
                if (event.key === "Tab") {
                    event.preventDefault();
                    handleTab(cm);
                }
            })
            editor.on("inputRead", function (instance, changeObj) {
                let cursor = editor.getCursor();
                let lineContent = editor.getLine(cursor.line);
                let currentChar = lineContent.charAt(cursor.ch - 1);
                switch (currentChar) {
                    case "(":
                        editor.replaceRange(")", cursor);
                        editor.setCursor(cursor.line, cursor.ch);
                        break;
                    case "[":
                        editor.replaceRange("]", cursor);
                        editor.setCursor(cursor.line, cursor.ch);
                        break;
                    case "{":
                        editor.replaceRange("}", cursor);
                        editor.setCursor(cursor.line, cursor.ch);
                        break;
                    case "'":
                        editor.replaceRange("'", cursor);
                        editor.setCursor(cursor.line, cursor.ch);
                        break;
                    case '"':
                        editor.replaceRange('"', cursor);
                        editor.setCursor(cursor.line, cursor.ch);
                        break;
                }

            })
        })
        .catch((error) => {
            console.error(error)
        })
}

function loadScript() {
    language = document.getElementById("language").value;
    indentType = document.getElementById("indentType").value;
    indentUnit = parseInt(document.getElementById("indentUnit").value);
    [modeName, scriptPath] = parseLanguage(language)

    switch (indentType) {
        case "tab":
            indentType = true;
            indentUnit = 4;
            break;
        case "space":
            indentType = false;
            break;
    }

    import(scriptPath)
        .then((module) => {
            editor.setValue("", {
                mode: {
                    name: modeName,
                    singleLineStringErrors: true
                },
                lineNumbers: true,
                indentWithTabs: indentType,
                indentUnit: indentUnit,
                matchBrackets: true,
                firstLineNumber: 0,
                smartIndent: true,
                theme: "darcula",
            });
            editor.on("keydown", function (cm, event) {
                if (event.key === "Tab") {
                    event.preventDefault();
                    handleTab(cm);
                }
            })
        })
        .catch((error) => {
            console.error(error)
        })
}

function parseLanguage(language) {
    language = document.getElementById("language").value;
    switch (language) {
        case "1001":
        case "50":
            modeName = "text/x-csrc";
            scriptPath = "../lib/codemirror/mode/clike.js";
            break;
        case "1022":
        case "1021":
        case "1023":
            modeName = "text/x-csharp";
            scriptPath = "../lib/codemirror/mode/clike.js";
            break;
        case "1002":
        case "54":
        case "1015":
        case "1012":
            modeName = "text/x-c++src";
            scriptPath = "../lib/codemirror/mode/clike.js";
            break;
        case "60":
            modeName = "text/x-go"
            scriptPath = "../lib/codemirror/mode/go.js";
            break;
        case "1004":
            modeName = "text/x-java";
            scriptPath = "../lib/codemirror/mode/clike.js";
            break;
        case "63":
            modeName = "text/javascript";
            scriptPath = "../lib/codemirror/mode/javascript.js";
            break;
        case "79":
            modeName = "text/x-objectivec";
            scriptPath = "../lib/codemirror/mode/clike.js";
            break;
        case "68":
            modeName = "application/x-httpd-php"
            scriptPath = "../lib/codemirror/mode/php.js";
            break;
        case "70":
            modeName = "text/x-cpython"
            scriptPath = "../lib/codemirror/mode/python.js";
            break;
        case "71":
            modeName = "text/x-python"
            scriptPath = "../lib/codemirror/mode/python.js";
            break;
        case "80":
            modeName = "text/x-rsrc"
            scriptPath = "../lib/codemirror/mode/r.js";
            break;
        case "72":
            modeName = "text/x-ruby";
            scriptPath = "../lib/codemirror/mode/ruby.js";
            break;
        case "73":
            modeName = "rust";
            scriptPath = "../lib/codemirror/mode/rust.js";
            break;
        case "83":
            modeName = "text/x-swift";
            scriptPath = "../lib/codemirror/mode/swift.js";
            break;
        case "74":
            modeName = "text/typescript";
            scriptPath = "../lib/codemirror/mode/javascript.js";
            break;
    }
    return [modeName, scriptPath]
}

function handleTab(cm) {
    if (cm.somethingSelected()) {
        cm.indentSelection("add");
    } else {
        cm.replaceSelection(Array(parseInt(cm.getOption("indentUnit")) + 1).join(" "), "end", "+input");
    }
}

async function postCodeMsg() {
    const code = editor.getValue();
    let stdin = document.getElementById("input").textContent;
    let returnMsg;
    let response = await fetch("/codev", {
        method: "POST", headers: {"Content_Type": "application/json"},
        body: JSON.stringify({
            "inputValue": stdin,
            "languageID": parseInt(language),
            "sourceCode": code
        })
    })
    let status = response.status;
    let data = await response.json();

    if (status === 200) {
        if (data["response"]["stderr"] !== "") {
            returnMsg = data["response"]["stderr"]
        } else {
            returnMsg = data["response"]["stdout"]
        }
    } else {
        returnMsg = data["response"]
    }
    let output = document.getElementById("output")
    output.innerHTML = returnMsg
}