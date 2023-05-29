function getCookie(name) {
    let cookieArr = document.cookie.split(";");

    for (let i = 0; i < cookieArr.length; i++) {
        let cookiePair = cookieArr[i].trim().split("=");
        let cookieName = cookiePair[0];
        let cookieValue = cookiePair[1];

        if (cookieName === name) {
            return decodeURIComponent(cookieValue);
        }
    }
    return null;
}

function includesIgnoreCase(stringList, string) {
    const stringListUpper = stringList.map(str => str.toUpperCase());
    return stringListUpper.includes(string.toUpperCase())
}

async function postRequestServer(url, body) {
    return await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: body
    })
}

const commandInput = document.querySelector('.command__input');

commandInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        commandInput.setAttribute("disabled", "true");
        const _ = commandListener(event);
        event.preventDefault();
    }
});

async function addNewTerminal(username, ip) {
    const terminal = document.querySelector(".terminal");
    terminal.classList.add("terminal");
    const newCommand = document.createElement("div");
    newCommand.classList.add("command");
    const newUserInfo = document.createElement("span");
    newUserInfo.classList.add("user__info");
    newUserInfo.textContent = username + "@" + ip + "\u00A0/\u00A0$\u00A0";
    const newCommandInput = document.createElement("input");
    newCommandInput.classList.add("command__input");
    newCommandInput.type = "text";
    newCommandInput.autofocus = true;
    newCommandInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            newCommandInput.setAttribute("disabled", true);
            commandListener(event);
            event.preventDefault();
        }
    });
    newCommand.appendChild(newUserInfo);
    newCommand.appendChild(newCommandInput);
    terminal.appendChild(newCommand);
    newCommandInput.focus();
}

class Command {
    constructor(commandName) {
        this.commandName = commandName;
        this.aliasList = [];
        this.params = {};
        this.resp = undefined;
    };

    alias(aliasName) {
        this.aliasList.add(aliasName);
    };

    async execute(inputList) {
        this.resp = "ERROR: [command] command that cannot be parsed".replace("[command]", "[" + this.commandName + "]");
        this.printResponse()
    }

    async postRequestServer(url, body) {
        return await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: body
        })
    };

    printResponse() {
        const currentTerminalElement = document.querySelector(".terminal")
        const result = document.createElement("div");
        result.classList.add("result");
        result.innerHTML = this.resp;
        currentTerminalElement.appendChild(result);
    }
}

class ClearCommand extends Command {
    constructor(commandName) {
        super(commandName);
        this.aliasList = ["clear", "cls"];
    }

    async execute(inputList) {
        if (inputList.length !== 0) {
            this.resp = "ERROR: [command] command that cannot be parsed".replace("[command]", "[" + this.commandName + " " + inputList.join(" ") + "]");
            this.printResponse();
        } else {
            const fatherDiv = document.querySelector(".terminal");
            fatherDiv.innerHTML = "";
        }
    }
}

class TranslateCommand extends Command {
    constructor(commandName) {
        super(commandName);
        this.aliasList = ["translate", "trans", "tr"];
        this.supportLang = {
            'BG': 'Bulgarian',
            'CS': 'Czech',
            'DA': 'Danish',
            "DE": "German",
            'EL': 'Greek',
            'EN': 'English(unspecified variant for backward compatibility; please select EN-GB or EN-US instead)',
            'EN-GB': 'English(British)',
            'EN-US': 'English(American)',
            'ES': 'Spanish',
            'ET': 'Estonian',
            'FI': 'Finish',
            'FR': 'French',
            'HU': 'Hungarian',
            'ID': 'Indonesian',
            'IT': 'Italian',
            'JA': 'Japanese',
            'KO': 'Korean',
            'LT': 'Lithuanian',
            'LV': 'Latvian',
            'NB': 'Norwegian(Bokmål)',
            'NL': 'Dutch',
            'PL': 'Polish',
            'PT': 'Portuguese',
            'PT-BR': 'Portuguese(Brazilian)',
            'PT-PT': 'Portuguese(all Portuguese varieties excluding Brazilian Portuguese)',
            'RO': 'Romanian',
            'RU': 'Russian',
            'SK': 'Slovak',
            'SL': 'Slovenian',
            'SV': 'Swedish',
            'TR': 'Turkish',
            'UK': 'Ukrainian',
            'ZH': 'Chinese(simplified)',
        }
    }

    parseParams(inputList) {
        this.params = {
            "targetLang": "EN-US",
            "text": ""
        }
        if (inputList[0].startsWith("-")) {
            this.params["targetLang"] = inputList[0].substring(1).toUpperCase();
            this.params["text"] = inputList.slice(1).join(" ");
        } else {
            this.params["text"] = inputList.join(" ");
        }
    }

    async execute(inputList) {
        if (inputList.length === 0) {
            this.resp = "ERROR: [command] command that cannot be parsed".replace("[command]", "[" + this.commandName + "]");
        } else {
            this.parseParams(inputList);
            if (!this.supportLang.hasOwnProperty(this.params["targetLang"])) {
                this.resp = "ERROR: Unsupported target languages."
            } else {
                const requestBody = JSON.stringify(this.params);
                const response = await postRequestServer("/tools/translator", requestBody)
                const data = await response.json();
                this.resp = data["response"]
            }
        }
        this.printResponse();
    }
}

class ForeignExchangeCommand extends Command {
    constructor(commandName) {
        super(commandName);
        this.aliasList = ["fx", "ex"];
        this.foreignAliasIndex = {
            "人民币": "CNY",
            "美元": "USD",
            "欧元": "EUR",
            "日元": "JPY",
            "英镑": "GBP",
            "港币": "HKD",
            "澳元": "AUD",
            "新西兰元": "NZD",
            "新加坡元": "SGD",
            "新币": "SGD",
            "瑞士法郎": "CHF",
            "加元": "CAD",
            "马来西亚令吉": "MYR",
            "令吉": "MYR",
            "俄罗斯卢布": "RUB",
            "卢布": "RUB",
            "韩元": "KRW",
            "阿拉伯联合酋长国迪拉姆": "AED",
            "迪拉姆": "AED",
            "土耳其里拉": "TRY",
            "里拉": "TRY",
            "墨西哥比索": "MXN",
            "泰铢": "THB",
        };
        this.supportForeignISO = ["CNY", "USD", "EUR", "JPY", "HKD", "GBP", "AUD", "NZD", "SGD", "CHF", "CAD", "MYR", "RUB", "ZAR", "KRW", "AED", "SAR", "HUF", "PLN", "DKK", "SEK", "NOK", "TRY", "MXN", "THB"];
        this.errorMsg = "ERROR: [command] command that cannot be parsed".replace("[command]", "[" + this.commandName + "]")
        this.linkUrl = "https://www.chinamoney.com.cn";
        this.dataSourceDesc = "\n汇率数据来源中国外汇交易中心: [link]".replace("[link]", '<a href="' + this.linkUrl + '" target="_blank">' + this.linkUrl + '<a/>')
    }

    parseParams(inputList) {
        this.params = {
            "sourceCurrency": "CNY",
            "targetCurrency": "USD"
        }
        switch (inputList.length) {
            case 0:
                this.resp = "ERROR: [command] command that cannot be parsed".replace("[command]", "[" + this.commandName + "]");
                break;
            case 1:
                this.inputValue = inputList[0]
                if (/^\d+(\.\d+)?$/.test(this.inputValue) === false) {
                    this.resp = this.errorMsg;
                }
                break;
            case 2:
                this.params["targetCurrency"] = inputList[0].toUpperCase();
                this.inputValue = inputList[1]
                if (/^\d+(\.\d+)?$/.test(this.inputValue) === false) {
                    this.resp = this.errorMsg;
                }
                break;
            case 3:
                if (inputList[0].toUpperCase() === "-S") {
                    this.params["sourceCurrency"] = inputList[1].toUpperCase();
                    this.params["targetCurrency"] = "CNY";
                } else if (inputList[0].toUpperCase() === "-T") {
                    this.params["sourceCurrency"] = "CNY";
                    this.params["targetCurrency"] = inputList[1].toUpperCase();
                } else {
                    this.params["sourceCurrency"] = inputList[0].toUpperCase();
                    this.params["targetCurrency"] = inputList[1].toUpperCase();
                }
                this.inputValue = inputList[2]
                if (/^\d+(\.\d+)?$/.test(this.inputValue) === false) {
                    this.resp = this.errorMsg;
                }
                break;
            case 4:
                if (inputList[0].toUpperCase() === "-S") {
                    this.params["sourceCurrency"] = inputList[1].toUpperCase();
                    this.params["targetCurrency"] = inputList[2].toUpperCase();
                } else if (inputList[1].toUpperCase() === "-S") {
                    this.params["sourceCurrency"] = inputList[2].toUpperCase();
                    this.params["targetCurrency"] = inputList[0].toUpperCase();
                } else if (inputList[0].toUpperCase() === "-T") {
                    this.params["sourceCurrency"] = inputList[2].toUpperCase();
                    this.params["targetCurrency"] = inputList[1].toUpperCase();
                } else if (inputList[1].toUpperCase() === "-T") {
                    this.params["sourceCurrency"] = inputList[0].toUpperCase();
                    this.params["targetCurrency"] = inputList[2].toUpperCase();
                }
                this.inputValue = inputList[3];
                if (/^\d+(\.\d+)?$/.test(this.inputValue) === false) {
                    this.resp = this.errorMsg;
                }
                break;
            case 5:
                if (inputList[0].toUpperCase() === "-S" && inputList[2].toUpperCase() === "-T") {
                    this.params["sourceCurrency"] = inputList[1].toUpperCase();
                    this.params["targetCurrency"] = inputList[3].toUpperCase();
                } else if (inputList[0].toUpperCase() === "-T" && inputList[2].toUpperCase() === "-S") {
                    this.params["targetCurrency"] = inputList[1].toUpperCase();
                    this.params["sourceCurrency"] = inputList[3].toUpperCase();
                }
                this.inputValue = inputList[4]
                if (/^\d+(\.\d+)?$/.test(this.inputValue) === false) {
                    this.resp = this.errorMsg;
                }
                break;
            default:
                this.resp = this.errorMsg;
        }
    }

    async execute(inputList) {
        this.parseParams(inputList);
        if (!this.foreignAliasIndex.hasOwnProperty(this.params["sourceCurrency"]) && !this.supportForeignISO.includes(this.params["sourceCurrency"])) {
            this.resp = this.errorMsg + this.dataSourceDesc
        } else {
            if (this.foreignAliasIndex.hasOwnProperty(this.params["sourceCurrency"])) {
                this.params["sourceCurrency"] = this.foreignAliasIndex[this.params["sourceCurrency"]]
            }
        }
        if (!this.foreignAliasIndex.hasOwnProperty(this.params["targetCurrency"]) && !this.supportForeignISO.includes(this.params["targetCurrency"])) {
            this.resp = this.errorMsg + this.dataSourceDesc
        } else {
            if (this.foreignAliasIndex.hasOwnProperty(this.params["targetCurrency"])) {
                this.params["targetCurrency"] = this.foreignAliasIndex[this.params["targetCurrency"]]
            }
        }
        if (typeof (this.resp) === "undefined") {
            let exchangeRate = await this.getExchangeRate();
            if (exchangeRate === "-1.0") {
                this.resp = "ERROR: Source currency exchange rate information not available." + this.dataSourceDesc
            } else if (exchangeRate === "-2.0") {
                this.resp = "ERROR: Target currency exchange rate information not available." + this.dataSourceDesc
            } else {
                if (this.params["sourceCurrency"] === "JPY") {
                    exchangeRate = exchangeRate / 100
                } else if (this.params["targetCurrency"] === "JPY") {
                    exchangeRate = exchangeRate * 100
                }
                this.resp = (this.inputValue * exchangeRate * 100) / 100;
                this.resp = this.resp.toFixed(5);
                this.resp = this.inputValue + this.params["sourceCurrency"] + " = " + this.resp + this.params["targetCurrency"] + "\n数据结果基于人民币汇率中间价进行计算" + this.dataSourceDesc;
            }
        }
        this.printResponse();
    }

    async getExchangeRate() {
        const exchangeRateRequestBody = JSON.stringify(this.params)
        const response = await postRequestServer("/tools/currency_converter", exchangeRateRequestBody)
        const data = await response.json()
        return data["response"]
    }
}

class OpenCommand extends Command {
    constructor(commandName) {
        super(commandName);
        this.aliasList = ["open"];
    }

    async execute(inputList) {
        if (inputList.length === 0) {
            this.resp = "ERROR: [command] command that cannot be parsed".replace("[command]", "[" + this.commandName + "]");
        } else {
            const protocolHeaders = ["https://", "http://", "file:///", "ftp://"]
            switch (inputList.length) {
                case 1:
                    if (protocolHeaders.some(protocolHeader => inputList[0].toLowerCase().startsWith(protocolHeader))) {
                        window.open(inputList[0], "_blank");
                    } else {
                        this.resp = "ERROR: Temporarily unsupported protocols, or protocols missing. HTTP, HTTPS, FILE, FTP are supported protocols for this application."
                    }
                    break;
                case 2:
                    if (protocolHeaders.some(protocolHeader => inputList[1].toLowerCase().startsWith(protocolHeader))) {
                        if (inputList[0].toUpperCase() === "-R") {
                            window.location.href = inputList[0];
                        } else if (inputList[0].toUpperCase() === "-N") {
                            window.open(inputList[0], "_blank");
                        } else {
                            this.resp = "Error: Illegal mode\n"
                                + "open -N :(default) Open new window\n"
                                + "\t-R :Current window open link\n"
                        }
                    } else {
                        this.resp = "ERROR: Temporarily unsupported protocols, or protocols missing. HTTP, HTTPS, FILE, FTP are supported protocols for this application."
                    }
                    break;
                default:
                    this.resp = "ERROR: Commands that cannot be parsed."
                    break;
            }
        }
        if (typeof this.resp !== "undefined") {
            this.printResponse();
        }
    }
}

class CodeVCommand extends Command {
    constructor(commandName) {
        super(commandName);
        this.aliasList = ["codev"]
    }

    execute(inputList) {
        if (inputList.length !== 0) {
            this.resp = "ERROR: [command] command that cannot be parsed".replace("[command]", "[" + this.commandName + " " + inputList.join(" ") + "]");
        } else {
            window.location.href = "/codev";
            return
        }
        if (typeof this.resp !== "undefined") {
            this.printResponse();
        }
    }
}

class Base64Command extends Command {
    constructor(commandName) {
        super(commandName);
        this.aliasList = ["base64", "b64"];
    }

    parseParams(inputList) {
        this.params = {
            "mode": "Encode",
            "sourceString": ""
        }
        switch (inputList.length) {
            case 0:
                this.resp = "ERROR: [command] command that cannot be parsed".replace("[command]", "[" + this.commandName + "]");
                break;
            case 1:
                this.params["sourceString"] = inputList[0];
                break;
            default:
                switch (inputList[0].toUpperCase()) {
                    case "-E":
                        this.params["sourceString"] = inputList[1];
                        break
                    case "-D":
                        this.params["mode"] = "Decode";
                        this.params["sourceString"] = inputList[1];
                        break
                    default:
                        this.params["sourceString"] = inputList.join(" ");
                        break;
                }
                break;
        }
    }

    async execute(inputList) {
        let base64RequestBody, response;
        this.parseParams(inputList);
        if (this.params.mode === "Decode") {
            delete this.params.mode;
            base64RequestBody = JSON.stringify(this.params);
            response = await postRequestServer("/tools/base64_decoder", base64RequestBody);
        } else {
            delete this.params.mode;
            base64RequestBody = JSON.stringify(this.params);
            response = await postRequestServer("/tools/base64_encoder", base64RequestBody);
        }
        const data = await response.json();
        if (typeof this.resp === "undefined") {
            this.resp = data["response"];
        }
        this.printResponse();
    }
}

class TimeCommand extends Command {
    constructor(commandName) {
        super(commandName);
        this.aliasList = ["tsc", "tmc"];
        this.timeZones = [
            "Africa/Abidjan",
            "Africa/Accra",
            "Africa/Addis_Ababa",
            "Africa/Algiers",
            "Africa/Asmara",
            "Africa/Asmera",
            "Africa/Bamako",
            "Africa/Bangui",
            "Africa/Banjul",
            "Africa/Bissau",
            "Africa/Blantyre",
            "Africa/Brazzaville",
            "Africa/Bujumbura",
            "Africa/Cairo",
            "Africa/Casablanca",
            "Africa/Ceuta",
            "Africa/Conakry",
            "Africa/Dakar",
            "Africa/Dar_es_Salaam",
            "Africa/Djibouti",
            "Africa/Douala",
            "Africa/El_Aaiun",
            "Africa/Freetown",
            "Africa/Gaborone",
            "Africa/Harare",
            "Africa/Johannesburg",
            "Africa/Juba",
            "Africa/Kampala",
            "Africa/Khartoum",
            "Africa/Kigali",
            "Africa/Kinshasa",
            "Africa/Lagos",
            "Africa/Libreville",
            "Africa/Lome",
            "Africa/Luanda",
            "Africa/Lubumbashi",
            "Africa/Lusaka",
            "Africa/Malabo",
            "Africa/Maputo",
            "Africa/Maseru",
            "Africa/Mbabane",
            "Africa/Mogadishu",
            "Africa/Monrovia",
            "Africa/Nairobi",
            "Africa/Ndjamena",
            "Africa/Niamey",
            "Africa/Nouakchott",
            "Africa/Ouagadougou",
            "Africa/Porto-Novo",
            "Africa/Sao_Tome",
            "Africa/Tripoli",
            "Africa/Tunis",
            "Africa/Windhoek",
            "America/Adak",
            "America/Anchorage",
            "America/Anguilla",
            "America/Antigua",
            "America/Araguaina",
            "America/Argentina/Buenos_Aires",
            "America/Argentina/Catamarca",
            "America/Argentina/Cordoba",
            "America/Argentina/Jujuy",
            "America/Argentina/La_Rioja",
            "America/Argentina/Mendoza",
            "America/Argentina/Rio_Gallegos",
            "America/Argentina/Salta",
            "America/Argentina/San_Juan",
            "America/Argentina/San_Luis",
            "America/Argentina/Tucuman",
            "America/Argentina/Ushuaia",
            "America/Aruba",
            "America/Asuncion",
            "America/Atikokan",
            "America/Bahia",
            "America/Bahia_Banderas",
            "America/Barbados",
            "America/Belem",
            "America/Belize",
            "America/Blanc-Sablon",
            "America/Boa_Vista",
            "America/Bogota",
            "America/Boise",
            "America/Cambridge_Bay",
            "America/Campo_Grande",
            "America/Cancun",
            "America/Caracas",
            "America/Cayenne",
            "America/Cayman",
            "America/Chicago",
            "America/Chihuahua",
            "America/Ciudad_Juarez",
            "America/Costa_Rica",
            "America/Creston",
            "America/Cuiaba",
            "America/Curacao",
            "America/Danmarkshavn",
            "America/Dawson",
            "America/Dawson_Creek",
            "America/Denver",
            "America/Detroit",
            "America/Dominica",
            "America/Edmonton",
            "America/Eirunepe",
            "America/El_Salvador",
            "America/Fort_Nelson",
            "America/Fortaleza",
            "America/Glace_Bay",
            "America/Godthab",
            "America/Goose_Bay",
            "America/Grand_Turk",
            "America/Grenada",
            "America/Guadeloupe",
            "America/Guatemala",
            "America/Guayaquil",
            "America/Guyana",
            "America/Halifax",
            "America/Havana",
            "America/Hermosillo",
            "America/Indiana/Indianapolis",
            "America/Indiana/Knox",
            "America/Indiana/Marengo",
            "America/Indiana/Petersburg",
            "America/Indiana/Tell_City",
            "America/Indiana/Vevay",
            "America/Indiana/Vincennes",
            "America/Indiana/Winamac",
            "America/Indianapolis",
            "America/Inuvik",
            "America/Iqaluit",
            "America/Jamaica",
            "America/Juneau",
            "America/Kentucky/Louisville",
            "America/Kentucky/Monticello",
            "America/Kralendijk",
            "America/La_Paz",
            "America/Lima",
            "America/Los_Angeles",
            "America/Lower_Princes",
            "America/Maceio",
            "America/Managua",
            "America/Manaus",
            "America/Marigot",
            "America/Martinique",
            "America/Matamoros",
            "America/Mazatlan",
            "America/Menominee",
            "America/Merida",
            "America/Metlakatla",
            "America/Mexico_City",
            "America/Miquelon",
            "America/Moncton",
            "America/Monterrey",
            "America/Montevideo",
            "America/Montreal",
            "America/Montserrat",
            "America/Nassau",
            "America/New_York",
            "America/Nome",
            "America/Noronha",
            "America/North_Dakota/Beulah",
            "America/North_Dakota/Center",
            "America/North_Dakota/New_Salem",
            "America/Nuuk",
            "America/Ojinaga",
            "America/Panama",
            "America/Paramaribo",
            "America/Phoenix",
            "America/Port-au-Prince",
            "America/Port_of_Spain",
            "America/Porto_Velho",
            "America/Puerto_Rico",
            "America/Punta_Arenas",
            "America/Rankin_Inlet",
            "America/Recife",
            "America/Regina",
            "America/Resolute",
            "America/Rio_Branco",
            "America/Santarem",
            "America/Santiago",
            "America/Santo_Domingo",
            "America/Sao_Paulo",
            "America/Scoresbysund",
            "America/Sitka",
            "America/St_Barthelemy",
            "America/St_Johns",
            "America/St_Kitts",
            "America/St_Lucia",
            "America/St_Thomas",
            "America/St_Vincent",
            "America/Swift_Current",
            "America/Tegucigalpa",
            "America/Thule",
            "America/Tijuana",
            "America/Toronto",
            "America/Tortola",
            "America/Vancouver",
            "America/Virgin",
            "America/Whitehorse",
            "America/Winnipeg",
            "America/Yakutat",
            "America/Yellowknife",
            "Antarctica/Davis",
            "Antarctica/DumontDUrville",
            "Antarctica/Mawson",
            "Antarctica/McMurdo",
            "Antarctica/Palmer",
            "Antarctica/Syowa",
            "Antarctica/Troll",
            "Antarctica/Vostok",
            "Arctic/Longyearbyen",
            "Asia/Aden",
            "Asia/Almaty",
            "Asia/Amman",
            "Asia/Anadyr",
            "Asia/Aqtau",
            "Asia/Aqtobe",
            "Asia/Ashgabat",
            "Asia/Atyrau",
            "Asia/Baghdad",
            "Asia/Bahrain",
            "Asia/Baku",
            "Asia/Bangkok",
            "Asia/Barnaul",
            "Asia/Beirut",
            "Asia/Bishkek",
            "Asia/Brunei",
            "Asia/Calcutta",
            "Asia/Chita",
            "Asia/Choibalsan",
            "Asia/Chongqing",
            "Asia/Colombo",
            "Asia/Damascus",
            "Asia/Dhaka",
            "Asia/Dili",
            "Asia/Dubai",
            "Asia/Dushanbe",
            "Asia/Famagusta",
            "Asia/Gaza",
            "Asia/Hebron",
            "Asia/Ho_Chi_Minh",
            "Asia/Hong_Kong",
            "Asia/Hovd",
            "Asia/Irkutsk",
            "Asia/Istanbul",
            "Asia/Jakarta",
            "Asia/Jayapura",
            "Asia/Jerusalem",
            "Asia/Kabul",
            "Asia/Kamchatka",
            "Asia/Karachi",
            "Asia/Kathmandu",
            "Asia/Katmandu",
            "Asia/Khandyga",
            "Asia/Kolkata",
            "Asia/Krasnoyarsk",
            "Asia/Kuala_Lumpur",
            "Asia/Kuching",
            "Asia/Kuwait",
            "Asia/Macao",
            "Asia/Macau",
            "Asia/Magadan",
            "Asia/Makassar",
            "Asia/Manila",
            "Asia/Muscat",
            "Asia/Nicosia",
            "Asia/Novokuznetsk",
            "Asia/Novosibirsk",
            "Asia/Omsk",
            "Asia/Oral",
            "Asia/Phnom_Penh",
            "Asia/Pontianak",
            "Asia/Pyongyang",
            "Asia/Qatar",
            "Asia/Qostanay",
            "Asia/Qyzylorda",
            "Asia/Rangoon",
            "Asia/Riyadh",
            "Asia/Sakhalin",
            "Asia/Samarkand",
            "Asia/Seoul",
            "Asia/Shanghai",
            "Asia/Singapore",
            "Asia/Srednekolymsk",
            "Asia/Taipei",
            "Asia/Tashkent",
            "Asia/Tbilisi",
            "Asia/Tehran",
            "Asia/Thimphu",
            "Asia/Tokyo",
            "Asia/Tomsk",
            "Asia/Ujung_Pandang",
            "Asia/Ulaanbaatar",
            "Asia/Urumqi",
            "Asia/Vientiane",
            "Asia/Vladivostok",
            "Asia/Yakutsk",
            "Asia/Yangon",
            "Asia/Yekaterinburg",
            "Asia/Yerevan",
            "Atlantic/Azores",
            "Atlantic/Bermuda",
            "Atlantic/Canary",
            "Atlantic/Cape_Verde",
            "Atlantic/Faeroe",
            "Atlantic/Faroe",
            "Atlantic/Madeira",
            "Atlantic/Reykjavik",
            "Atlantic/South_Georgia",
            "Atlantic/St_Helena",
            "Atlantic/Stanley",
            "Australia/Adelaide",
            "Australia/Brisbane",
            "Australia/Broken_Hill",
            "Australia/Canberra",
            "Australia/Darwin",
            "Australia/Eucla",
            "Australia/Hobart",
            "Australia/Lindeman",
            "Australia/NSW",
            "Australia/North",
            "Australia/Perth",
            "Australia/Queensland",
            "Australia/South",
            "Australia/Sydney",
            "Australia/Tasmania",
            "Australia/Victoria",
            "Australia/West",
            "Chile/Continental",
            "Europe/Amsterdam",
            "Europe/Andorra",
            "Europe/Astrakhan",
            "Europe/Athens",
            "Europe/Belgrade",
            "Europe/Berlin",
            "Europe/Bratislava",
            "Europe/Brussels",
            "Europe/Bucharest",
            "Europe/Budapest",
            "Europe/Busingen",
            "Europe/Chisinau",
            "Europe/Copenhagen",
            "Europe/Dublin",
            "Europe/Gibraltar",
            "Europe/Guernsey",
            "Europe/Helsinki",
            "Europe/Isle_of_Man",
            "Europe/Istanbul",
            "Europe/Jersey",
            "Europe/Kaliningrad",
            "Europe/Kiev",
            "Europe/Kirov",
            "Europe/Kyiv",
            "Europe/Lisbon",
            "Europe/Ljubljana",
            "Europe/London",
            "Europe/Luxembourg",
            "Europe/Madrid",
            "Europe/Malta",
            "Europe/Mariehamn",
            "Europe/Minsk",
            "Europe/Monaco",
            "Europe/Moscow",
            "Europe/Oslo",
            "Europe/Paris",
            "Europe/Podgorica",
            "Europe/Prague",
            "Europe/Riga",
            "Europe/Rome",
            "Europe/Samara",
            "Europe/San_Marino",
            "Europe/Sarajevo",
            "Europe/Saratov",
            "Europe/Simferopol",
            "Europe/Skopje",
            "Europe/Sofia",
            "Europe/Stockholm",
            "Europe/Tallinn",
            "Europe/Tirane",
            "Europe/Ulyanovsk",
            "Europe/Vaduz",
            "Europe/Vatican",
            "Europe/Vienna",
            "Europe/Vilnius",
            "Europe/Volgograd",
            "Europe/Warsaw",
            "Europe/Zagreb",
            "Europe/Zurich",
            "Indian/Antananarivo",
            "Indian/Chagos",
            "Indian/Christmas",
            "Indian/Cocos",
            "Indian/Comoro",
            "Indian/Kerguelen",
            "Indian/Mahe",
            "Indian/Maldives",
            "Indian/Mauritius",
            "Indian/Mayotte",
            "Indian/Reunion",
            "Pacific/Apia",
            "Pacific/Auckland",
            "Pacific/Chatham",
            "Pacific/Chuuk",
            "Pacific/Easter",
            "Pacific/Efate",
            "Pacific/Enderbury",
            "Pacific/Fakaofo",
            "Pacific/Fiji",
            "Pacific/Funafuti",
            "Pacific/Galapagos",
            "Pacific/Gambier",
            "Pacific/Guadalcanal",
            "Pacific/Guam",
            "Pacific/Honolulu",
            "Pacific/Kanton",
            "Pacific/Kiritimati",
            "Pacific/Kosrae",
            "Pacific/Kwajalein",
            "Pacific/Majuro",
            "Pacific/Marquesas",
            "Pacific/Midway",
            "Pacific/Nauru",
            "Pacific/Niue",
            "Pacific/Norfolk",
            "Pacific/Noumea",
            "Pacific/Pago_Pago",
            "Pacific/Palau",
            "Pacific/Pitcairn",
            "Pacific/Pohnpei",
            "Pacific/Ponape",
            "Pacific/Port_Moresby",
            "Pacific/Rarotonga",
            "Pacific/Saipan",
            "Pacific/Samoa",
            "Pacific/Tahiti",
            "Pacific/Tarawa",
            "Pacific/Tongatapu",
            "Pacific/Truk",
            "Pacific/Wake",
            "Pacific/Wallis",
            "Pacific/Yap",
            "US/Samoa"
        ];
        this.cityTimeZoneMap = {};
        this.timeZones.forEach(value => {
            this.cityTimeZoneMap[value.split("/")[1].toUpperCase()] = value;
        });
    }

    parseTimestampParams(inputList) {
        this.params = {
            "timestamp": "",
            "timeZone": "",
            "precision": "Second"
        }
        const tzIndex = this.commonParseParams(inputList);
        const index = inputList.findIndex(item => item.toLowerCase() === "-ms");
        let ts;
        if (typeof tzIndex === "undefined" && index === -1) {
            ts = inputList.join("");
        } else if (typeof tzIndex !== "undefined" && index === -1) {
            ts = inputList.slice(tzIndex+2).join("");
        } else if (typeof tzIndex === "undefined" && index !== -1) {
            ts = inputList.slice(index+1).join("");
        } else {
            if (index > tzIndex) {
                ts = inputList.slice(index+1).join("");
            } else {
                ts = inputList.slice(tzIndex+2).join("");
            }
        }
        if (ts === "" && this.params.precision === "Second") {
            ts = Math.round(new Date().getTime()/1000);
        } else if (ts === "" && this.params.precision === "Milli") {
            ts = Math.round(new Date().getTime());
        }
        if (/^\d+(\.\d+)?$/.test(ts) === false) {
            this.resp = "ERROR: Incoming timestamp exception.";
        } else {
            this.params["timestamp"] = parseInt(ts);
        }
    }

    parseTimeParams(inputList) {
        this.params = {
            "sourceTime": "",
            "timeZone": "",
            "precision": "Second"
        }
        const tzIndex = this.commonParseParams(inputList);
        const index = inputList.findIndex(item => item.toLowerCase() === "-ms");
        if (typeof tzIndex === "undefined" && index === -1) {
            this.params["sourceTime"] = inputList.join(" ");
        } else if (typeof tzIndex !== "undefined" && index === -1) {
            this.params["sourceTime"] = inputList.slice(tzIndex+2).join(" ");
        } else if (typeof tzIndex === "undefined" && index !== -1) {
            this.params["sourceTime"] = inputList.slice(index+1).join(" ");
        } else {
            if (index > tzIndex) {
                this.params["sourceTime"] = inputList.slice(index+1).join(" ");
            } else {
                this.params["sourceTime"] = inputList.slice(tzIndex+2).join(" ");
            }
        }
    }

    commonParseParams(inputList) {
        if (includesIgnoreCase(inputList, "-ms")) {
            this.params["precision"] = "Milli"
        }
        if (includesIgnoreCase(inputList, "-tz")) {
            const tzIndex = inputList.findIndex(item => item.toLowerCase() === "-tz");
            if (tzIndex+1 <= inputList.length-1) {
                const tz = this.parseTimeZone(inputList[tzIndex+1]);
                if (typeof tz === "undefined") {
                    this.resp = "ERROR: For time zones that cannot be resolved, use 'Continent/City'(e.g. Asia/Shanghai) to specify the time zone, or specify the time zone by city name."
                } else {
                    this.params["timeZone"] = tz;
                    return tzIndex
                }
            } else {
                this.resp = "ERROR: "
            }
        }
    }

    async execute(inputList) {
        let response, timeConvertRequestBody;
        if (this.commandName.toLowerCase() === "tsc") {
            this.parseTimestampParams(inputList);
            if (typeof this.resp === "undefined") {
                timeConvertRequestBody = JSON.stringify(this.params);
                response = await postRequestServer("/tools/timestamp_converter", timeConvertRequestBody);
                const data = await response.json();
                this.resp = data["response"];
            }
        } else {
            this.parseTimeParams(inputList);
            if (typeof this.resp === "undefined") {
                timeConvertRequestBody = JSON.stringify(this.params);
                response = await postRequestServer("/tools/time_converter", timeConvertRequestBody);
                const data = await response.json();
                this.resp = data["response"];
            }
        }
        this.printResponse();
    }

    parseTimeZone(timeZone) {
        if (includesIgnoreCase(this.timeZones, timeZone)) {
            return timeZone
        } else if (this.cityTimeZoneMap.hasOwnProperty(timeZone.toUpperCase())) {
            return this.cityTimeZoneMap[timeZone.toUpperCase()]
        }
    }
}

class LoginCommand extends Command {
    constructor(commandName) {
        super(commandName);
        this.aliasList = ["login"]
    }

    async execute(inputList) {
        if (inputList.length !== 0) {
            this.resp = "ERROR: [command] command that cannot be parsed".replace("[command]", "[" + this.commandName + " " + inputList.join(" ") + "]");
        } else {
            window.location.href = "/login";
            return
        }
        if (typeof this.resp !== "undefined") {
            this.printResponse();
        }
    }
}

class ExitCommand extends Command {
    constructor(commandName) {
        super(commandName);
        this.aliasList = ["logout", "exit"];
    }

    async execute(inputList) {
        const response = await postRequestServer("/logout", null);
        const data = await response.json();
        this.resp = data["response"];
        if (this.commandName.toLowerCase() === "logout" && this.resp === true) {
            this.resp = "Logout Successful!"
            this.printResponse();
        } else if (this.commandName.toLowerCase() === "logout" && this.resp === false) {
            this.resp = "ERROR: No login info."
            this.printResponse();
        } else if (this.commandName.toLowerCase() === "exit"  && this.resp === true) {
            this.resp = "Logout Successful!"
            this.printResponse();
        } else if (this.commandName.toLowerCase() === "exit"  && this.resp === false) {
            window.open('', '_self').close();
        }

    }
}

class RegisterCommand extends Command {
    constructor(commandName) {
        super(commandName);
        this.aliasList = ["register", "signup"]
    }

    async execute(inputList) {
        if (inputList.length !== 0) {
            this.resp = "ERROR: [command] command that cannot be parsed".replace("[command]", "[" + this.commandName + " " + inputList.join(" ") + "]");
        } else {
            window.location.href = "/register";
            return
        }
        if (typeof this.resp !== "undefined") {
            this.printResponse();
        }
    }
}

class GoogleCommand extends Command {
    constructor(commandName) {
        super(commandName);
        this.aliasList = ["google", "go"]
    }

    async execute(inputList) {
        if (inputList.length === 0) {
            window.open("https://www.google.com")
        } else {
            inputList = inputList.map(str => str.replace("%", "%25"))
            inputList = inputList.map(str => str.replace("+", "%2B"))
            const search = inputList.join("%20")
            window.open( "https://www.google.com/search?q=" + search, "_blank");
        }
    }
}

class BingCommand extends Command {
    constructor(commandName) {
        super(commandName);
        this.aliasList = ["bing"]
    }

    async execute(inputList) {
        if (inputList.length === 0) {
            window.open("https://www.bing.com")
        } else {
            inputList = inputList.map(str => str.replace("%", "%25"))
            inputList = inputList.map(str => str.replace("+", "%2B"))
            const search = inputList.join("%20")
            window.open( "https://www.bing.com/search?q=" + search, "_blank");
        }
    }
}

class GithubCommand extends Command {
    constructor(commandName) {
        super(commandName);
        this.aliasList = ["github"]
    }

    async execute(inputList) {
        if (inputList.length === 0) {
            window.open("https://github.com/")
        } else {
            inputList = inputList.map(str => str.replace("%", "%25"))
            inputList = inputList.map(str => str.replace("+", "%2B"))
            const search = inputList.join("%20")
            window.open( "https://github.com/search?q=" + search, "_blank");
        }
    }
}

async function commandListener(event) {
    const inputText = event.target.value.trim();
    const textList = inputText.split(' ')
    const command = textList[0];

    const commandClasses = [
        ClearCommand, TranslateCommand, ForeignExchangeCommand, OpenCommand, Base64Command, CodeVCommand, TimeCommand,
        LoginCommand, ExitCommand, RegisterCommand, GoogleCommand, BingCommand, GithubCommand
    ];
    let commandClass;
    for (const cls of commandClasses) {
        const commandInstance = new cls(command);
        if (includesIgnoreCase(commandInstance.aliasList, command)) {
            commandClass = commandInstance;
        }
    }
    if (typeof commandClass === "undefined") {
        commandClass = new Command(command);
    }
    await commandClass.execute(textList.slice(1));

    const userInfo = JSON.parse(getCookie("__userInfo"));
    let username, ip;

    if (userInfo == null) {
        username = "Visitor";
        ip = "127.0.0.1";
    } else {
        username = userInfo["username"];
        ip = userInfo["IP"]
    }
    await addNewTerminal(username, ip);
}