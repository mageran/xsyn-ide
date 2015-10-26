var express = require('express');
var app = express();
var sys = require('util');
var xsyn = require('node-xsyn');
var fs = require('fs');

var moment = require('moment');

var bodyParser = require('body-parser');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(express.static('.'))

var DslServer = function(app,gmgr) {

    app.get('/api/grammar/:id?',function(req,res) {
	var id = req.params.id;
	//console.log('grammar id: ' + id)
	if (!!id) {
	    try {
		var LClass = gmgr.requireFromFile(id,module);
		var lobj = new LClass();
		var json = lobj.parser.toJson();
		if (json.name !== id) {
		    json.name = id;
		}
		json.loadedFromName = id;
		res.status(200).json(json)
	    } catch (e) {
		res.status(400).json({error:'error compiling language: ' + e})
		return
	    }
	} else {
	    // return list of grammars/dsls
	    gmgr.listGrammars(function(err,glist) {
		if (err) {
		    res.status(400).json({error:'error retrieving list of grammars: ' + err});
		    return;
		}
		res.status(200).json({result:glist});
	    });
	}
    });

    app.post('/api/grammar/:id',function(req,res) {
	var grammarObj = req.body;
	try {
	    var overwriteOk = false;
	    var doCheck = true;
	    gmgr.writeToFile(grammarObj,overwriteOk,module,doCheck);
	    //gmgr.checkGrammar(grammarObj,module);
	    res.status(200).json({message:'success'})
	} catch (e) {
	    res.status(400).json({error:''+e})
	    return
	}
    });

    app.put('/api/grammar/:id',function(req,res) {
	console.log("PUT request received.");
	var id = req.params.id;
	try {
	    var overwriteOk = false;
	    gmgr.createGrammar(id,overwriteOk);
	    res.status(200).json({message:'success'})
	} catch (e) {
	    res.status(400).json({error:''+e})
	    return
	}    
    });

    app.get('/api/grammar/exists/:id',function(req,res) {
	var id = req.params.id;
	console.log('grammar id: ' + id)
	try {
	    var result = gmgr.grammarExists(id);
	    res.status(200).json({result:result})
	} catch (e) {
	    res.status(400).json({error:'' + e})
	    return
	}
    });

    app.get(/^\/api\/grammar\/(rename|duplicate)\/([^\/]*)\/([^\/]*)$/,function(req,res) {
	var operation = req.params['0'] + 'Grammar';
	var oldid = req.params['1'];
	var newid = req.params['2'];
	//res.status(200).json({operation:operation,oldid:oldid,newid:newid});
	console.log(operation + ': ' + oldid + " => " + newid)
	try {
	    var result = gmgr[operation](oldid,newid);
	    res.status(200).json({result:result})
	} catch (e) {
	    console.error(e);
	    res.status(400).json({error:'' + e})
	    return
	}
    });

    app.get('/api/grammar/remove/:id',function(req,res) {
	var id = req.params.id;
	try {
	    var result = gmgr.removeGrammar(id);
	    res.status(200).json({result:result})
	} catch (e) {
	    console.error(e);
	    res.status(400).json({error:'' + e})
	    return
	}
    });

    app.post('/api/parse/:id',function(req,res) {
	var id = req.params.id;
	var inputString = req.body.code;
	try {
	    console.log("received post request for parsing a string...");
	    console.log(inputString);
	    var output = gmgr.parseString(id,inputString);
	    console.log('parseString ok');
	    console.log(output);
	    res.status(200).json({output:output})
	} catch (e) {
	    res.status(400).json({error:''+e})
	    return
	}
    });
}

var GrammarManager;
var gmgr;

var interactiveMode = false;
var port = 9292;
var enableRun = false;

var cmdlineOptions = {};
cmdlineOptions['-i'] = function(argv) {
    interactiveMode = true;
};
cmdlineOptions['--enablerun'] = function(argv) {
    enableRun = true;
};
cmdlineOptions['-p'] = function(argv) {
    port = Number(argv.shift());
};

var cmdlineArguments = process.argv.slice(2);

while (cmdlineArguments.length > 0) {
    var arg = cmdlineArguments.shift();
    var fun = cmdlineOptions[arg];
    if (typeof(fun) === 'function') {
	fun.call(0,cmdlineArguments);
    }
}

if (require.main === module) {
    console.log('run as main');

    GrammarManager = require('./grammar_manager');
    gmgr = new GrammarManager();

    if (interactiveMode) {
	console.log('starting interactice shell...');
	function myeval($$$$$x) {
	    return eval($$$$$x);
	}
	
	require('repl').start({
	    prompt : 'xsyn> ',
	    eval : function eval(cmd, context, filename, callback) {
		callback(null,myeval(cmd))
	    }
	});
    } else {
	if (enableRun) {
	    gmgr.enableRun = true;
	}
	new DslServer(app,gmgr);
	var server = app.listen(port, function () {
	    var host = server.address().address;
	    var port = server.address().port;
	    
	    console.log('xsyn-ide app listening at port %s', port);
	});
    }
} else {
    module.exports = DslServer;
}
