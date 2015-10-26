var pg = require('pg');
var defaultConnectionString = "postgres://postgres:abcd1234@localhost/abc";

var DbQuery = function(connectionString) {
    if (connectionString) {
	this.connectionString = connectionString;
    } else {
	this.connectionString = defaultConnectionString;
    }
}

DbQuery.prototype.run = function(query,parameters,callback) {
    pg.connect(this.connectionString, function(err, client, done) {
	var callbackOk = typeof(callback) === 'function';
	if(err) {
	    console.error('error fetching client from pool', err);
	    if (callbackOk) {
		callback.call(null,err);
	    }
	    return
	    
	}
	if (parameters == null) parameters = [];
	client.query(query, parameters, function(err, result) {
	    done();
	    
	    if(err) {
		console.error('error running query', err);
		if (callbackOk) {
		    callback.call(null,err);
		}
		return
	    }
	    console.log("result has " + result.length + " rows.");
	    if (callbackOk) {
		callback.call(null,null,result);
	    }
	});
    });
}
    
module.exports = DbQuery;
