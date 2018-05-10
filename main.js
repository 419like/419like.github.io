
let json;
function showJson(next) {
    var test;
    if (window.XMLHttpRequest) {
        test = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
        test = new window.ActiveXObject();
    } else {
        alert("请升级至最新版本的浏览器");
    }
    if (test != null) {
        test.open("GET", "data.json", true);
        test.send(null);
        test.onreadystatechange = function() {
            if (test.readyState == 4 && test.status == 200) {
                json = JSON.parse(test.responseText);
                next();
            }
        };

    }
}
function init(){
var ROOT = "LAWCLIB";
var content = document.getElementById("content")
funStrList = compileFunStr(json)
content.innerHTML = `local scriptDir = freeswitch.getGlobalVariable("script_dir")
local pos = string.find(scriptDir, "/$")
scriptDir =  pos and  scriptDir or scriptDir .. "/"
package.path = package.path .. ";" .. scriptDir .. "lib/?.lua"
local tool = require("common_tool")

local speechPath = "/usr/local/freeswitch/conf/speech/cn/ivr/law_collection_inbound_ivr/"
CurrentStep = ""
Root = "` + ROOT + `"
` + funStrList + `
_G[Root]()
`
}
window.onload = function() {
    showJson(init);
};


function compileFunStr(json) {
    holeStr = ''
    for (key in json) {
        console.log(key);
        value = json[key];
        holeStr += makeFunStr(key, value)
    }
    return holeStr
}

function makeFunStr(key, value) {
    let funStr = `function ` + key + `()
	-- `+value.text+`
	CurrentStep = "` + key + `"
    tool.ivrOperateLogEventForInput("goto",CurrentStep)
	` + getMainOfFun(value) + `
end
`
    return funStr
}

function getMainOfFun(item) {
    if (item.type == 'audio') {
        return `tool.audio(speechPath.."` + item.audioFile + `.wav")
	_G[CurrentStep.."` + item.next + `"]()`
    }

    if (item.type == 'audioCheck') {
        return `backStr = tool.audioInputTimes(`+item.minDigits+`,`+item.maxDigits+`,speechPath.."` + item.audioFile + `.wav",speechPath.."` + item.errorAudio + `.wav",speechPath.."` + item.lastErrorAudio + `.wav",` + item.maxTimes + `,"` + item.terminator + `",` + item.checkFun + `)
	_G[CurrentStep..backStr]()`
    }

    if (item.type == 'check') {
        return `backStr = searchIdentityId()
	_G[CurrentStep..backStr]()`
    }

    if (item.type == 'hangup') {
        return `hangup()`
    }

    if (item.type == 'audioChoose') {
        return `backStr = tool.audioInput(speechPath.."`+item.audioFile+`.wav")
	if(backStr == "`+item.replayNum+`")then
		_G[CurrentStep]()
	else
		_G[CurrentStep..backStr]()
	end`
    }

    if (item.type == 'checkByFun') {
        return `backStr = tool.isWorkingTime()
	_G[CurrentStep..backStr]()`
    }

    if (item.type == 'accessAgentQueueWaiting') {
        return `backStr = tool.accessAgentQueueWaiting("`+item.skillsetName+`")
	_G[CurrentStep..backStr]()`
    }
}
