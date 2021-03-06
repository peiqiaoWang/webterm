var http = require('http'),
    fs = require('fs'),
    socketio = require('socket.io'),
    child_pty = require('child_pty'),
    ss = require('socket.io-stream');

var config = require('./config.json');

var server = http.createServer()
	.listen(config.port, config.interface);

var ptys = {};


server.on('request', function(req, res) {
		var file = null;
		console.log(req.url);
		switch(req.url) {
		case '/':
		case '/index.html':
			file = '/index.html';
			break;
		case '/table.html':
			file = '/table.html';
			break;
		case '/bootstrap.min.css':
			file = '/css/bootstrap.min.css';
			break;
		case '/styles.css':
			file = '/css/styles.css';
			break;
		case '/jquery-3.1.1.min.js':
			file = '/js/jquery-3.1.1.min.js';
			break;
		case '/jtopo-0.4.6-min.js':
			file = '/js/jtopo-0.4.6-min.js';
			break;
		case '/bootstrap.min.js':
			file = '/js/bootstrap.min.js';
			break;		
		case '/intputGroup.js':
			file = '/js/intputGroup.js';
			break;
		case '/host.png':
			file = '/img/host.png';
			break;
		case '/switch.png':
			file = '/img/switch.png';
			break;
		case '/webterm.js':
			file = '/webterm.js';
			break;
		case '/terminal.js':
			file = '/node_modules/terminal.js/dist/terminal.js';
			break;
		case '/socket.io-stream.js':
			file = '/node_modules/socket.io-stream/socket.io-stream.js';
			break;
		default:
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end('404 Not Found');
			return;
		}
		fs.createReadStream(__dirname + file).pipe(res);
	});

socketio(server).of('pty').on('connection', function(socket) {
	// receives a bidirectional pipe from the client see index.html
	// for the client-side
	ss(socket).on('new', function(stream, options) {
		var name = options.name;

		var pty = child_pty.spawn('/bin/sh', ['-c', config.login], options);
		pty.stdout.pipe(stream).pipe(pty.stdin);
		ptys[name] = pty;
		socket.on('disconnect', function() {
			console.log("end");
			pty.kill('SIGHUP');
			delete ptys[name];
		});
	});
});

process.on('exit', function() {
	var k = Object.keys(ptys);
	var i;

	for(i = 0; i < k.length; i++) {
		ptys[k].kill('SIGHUP');
	}
});

console.log('Listening on ' + config.interface + ':' + config.port);
