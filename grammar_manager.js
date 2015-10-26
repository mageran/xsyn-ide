var xsyn = require('node-xsyn')
var fs = require('fs');
var path = require('path');
var inspect = require('util').inspect;



var GrammarManager = function(opts) {
    this.grammarDir = "xsyn_grammars";
    for(var prop in opts) {
	this[prop] = opts[prop];
    }
    this.grammarObjectCache = {};
};

GrammarManager.prototype.ensureGrammarDir = function() {
    try {
	fs.mkdirSync(this.grammarDir);
    } catch (e) {
	console.error(e);
    }
};

GrammarManager.prototype.listGrammars = function(callback) {
    this.ensureGrammarDir();
    var filterFiles = function(flist) {
	var glist = [];
	for(var i = 0; i < flist.length; i++) {
	    var fname = flist[i];
	    if (fname.match(".gra$")) {
		glist.push(fname.substr(0,fname.length-4));
	    }
	}
	return glist;
    };
    if (typeof(callback) === 'function') {
	fs.readdir(this.grammarDir,function(err,flist) {
	    if (err) {
		callback.call(null,err,[]);
		return;
	    }
	    var glist = filterFiles(flist);
	    callback.call(null,err,glist);
	});
    } else {
	flist = fs.readdirSync(this.grammarDir);
	return filterFiles(flist);
    }
};

GrammarManager.prototype.checkGrammarName = function(name) {
    if (name.match(/^[A-Za-z_][A-Za-z_0-9]*$/)) {
	return;
    }
    throw "invalid grammar name: \"" + name + "\""
};

GrammarManager.prototype.grammarModuleName = function(name) {
    this.checkGrammarName(name);
    var mname = path.join(this.grammarDir,name);
    if (!path.isAbsolute(mname)) {
	mname = './' + mname;
    }
    return mname;
};

GrammarManager.prototype.grammarFileName = function(name) {
    return this.grammarModuleName(name) + '.gra';
};

GrammarManager.prototype.requireFromFile = function(name,moduleContext) {
    var fname = this.grammarFileName(name);
    var modname = xsyn.languageModule(fname);
    var resolvedModuleName = require.resolve(modname);
    //console.log("resolvedModuleName: " + resolvedModuleName)
    delete require.cache[resolvedModuleName];
    return moduleContext.require(modname);
};

GrammarManager.prototype.grammarExists = function(name) {
    if (!name) throw "grammarExists called with null argument"
    var fname = this.grammarFileName(name);
    try {
	fs.accessSync(fname,fs.R_OK);
	return true;
    } catch (e) {
	return false;
    }
};

GrammarManager.prototype._initialGrammarContent = function(name) {
    var s = "";
    s += "% name : '" + name + "'\n"
    s += "Start : 'dummy' ; \n"
    return s;
};

GrammarManager.prototype.createGrammar = function(name,overwriteOk) {
    this.ensureGrammarDir();
    var fname = this.grammarFileName(name);
    var content = this._initialGrammarContent(name);
    if (!overwriteOk) {
	try {
	    fs.accessSync(fname,fs.R_OK);
	    // throw an exception, if the file exists
	    throw "cannot create grammar; '" + fname + "' already exists.";
	} catch (e) {
	}
    }
    fs.writeFileSync(fname,content);
};

GrammarManager.prototype.renameGrammar = function(oldName,newName) {
    var oldfname = this.grammarFileName(oldName);
    var newfname = this.grammarFileName(newName);
    fs.renameSync(oldfname,newfname);
    return true;
};

GrammarManager.prototype.duplicateGrammar = function(oldName,newName) {
    var oldfname = this.grammarFileName(oldName);
    var newfname = this.grammarFileName(newName);
    var fcontent = fs.readFileSync(oldfname,'utf-8');
    fs.writeFileSync(newfname,fcontent,'utf-8');
    return true;
};

GrammarManager.prototype.removeGrammar = function(name) {
    var fname = this.grammarFileName(name);
    fs.unlinkSync(fname);
    return true;
};

GrammarManager.prototype.writeToFile = function(grammarObj,overwriteOk,moduleContext,doCheck) {
    var name = grammarObj.name;
    if (!name) {
	throw "Grammar object doesn't have a name field; can't update an anonymous grammar."
    }
    var fname = this.grammarFileName(name);
    console.log("filename for grammar: " + fname);
    var grammarString = xsyn.jsonToGrammarString(grammarObj);
    console.log(grammarString);
    fs.writeFileSync(fname,grammarString);
    if (doCheck && moduleContext) {
	this.checkGrammar(name,moduleContext);
    }
};

GrammarManager.prototype.checkGrammar = function(name,moduleContext) {
    try {
	var L = this.requireFromFile(name,module);
	var lobj = new L();
	return lobj.parser.generateLalr1Parser();
    } catch (e) {
	console.error("generateParser error: " + e)
	throw e;
    }
}

GrammarManager.prototype.checkGrammar_ = function(grammarObj,moduleContext) {
    console.log('checking grammar...');
    console.log(inspect(grammarObj,{depth:999}));
    var lclass = xsyn.requireFromJson(grammarObj,moduleContext);
    console.log('require ok...');
    var lobj = new lclass();
    console.log("generateLalr1Parser...");
    lobj.parser.generateLalr1Parser();
    console.log('checking grammar ok.');
};

GrammarManager.prototype.watchGrammar = function(name,interval,moduleContext,require,callback) {
    var fname = this.grammarFileName(name);
    var deleteModuleFromCache = function(moduleName) {
	delete require.cache[require.resolve(moduleName)];
    };

    fs.watchFile(fname, { interval : interval }, function(current,previous) {
	if (current.mtime.toString() !== previous.mtime.toString()) {
	    console.log('grammar "' + name + '" changed.');
	    var moduleName = xsyn.languageModule(fname);
	    try {
		//delete require.cache[require.resolve(moduleName)];
		deleteModuleFromCache(moduleName);
	    } catch (e) {
		console.error(e);
	    }
	    if (typeof(callback) === 'function') {
		var newContent = moduleContext.require(moduleName);
		callback.call(null,newContent);
	    }
	}
    });
};

/*
 * creates the language parser (if not cached), parses the inputString and returns the result.
 */
GrammarManager.prototype.parseString = function(name,inputString) {
    try {
	var L = this.requireFromFile(name,module);
	var lobj = new L();
	if (this.enableRun) {
	    return lobj.parser.run(inputString);
	} else {
	    return lobj.parser.parse(inputString);
	}
    } catch (e) {
	console.error("parse error: " + e)
	throw e;
    }
};

module.exports = GrammarManager;
