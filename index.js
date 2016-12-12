const WebTorrent = require('webtorrent');
const client = new WebTorrent();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Fix memory leak
const EventEmitter = require('events').EventEmitter
EventEmitter.defaultMaxListeners = 0;

app.post('/add/new/torrent', (req, res) => {
	if(client){

		let uri = req.body.magneturi.match(/\burn:btih:([A-F\d]{40})\b/i);

		if(uri){

			if(!client.get(uri[1])){
				client.add(req.body.magneturi, function (torrent) {
			  		res.json({msn: 'Client is downloading', hash: torrent.infoHash});
			  	});
			}else{
				res.json({msn: 'Torrent já existe na fila.'});
			}

		}else{
			res.json({msn: 'Invalid magnet link.'});
		}

  	}
});

app.post('/torrent/list', (req, res) => {
	if(client.torrents.length > 0){

		let result = client.torrents.map(function(torrent) {
			
			let array = {
				path: torrent.path, 
				progress: torrent.progress, 
				received: torrent.received,
				timeRemaining: torrent.timeRemaining,
				downloaded: torrent.downloaded,
				uploaded: torrent.uploaded,
				downloadSpeed: torrent.downloadSpeed,
				uploadSpeed: torrent.uploadSpeed,
				ratio: torrent.ratio,
				numPeers: torrent.numPeers
			}

			return array;

		});

		res.json(result);

	}else{
		res.json({error: 'nenhum torrent encontrado.'});
	}
});

app.post('/torrent/remove', (req, res) => {

	if(client.get(req.body.magneturi)){
		client.remove(req.body.magneturi, (err) => {
			res.json({msn: 'Torrent removido.'});
		});
	}else{
		res.json({error: 'Torrent encontrado.'});
	}

});

app.post('/torrent/remove', (req, res) => {

	if(client.get(req.body.magneturi)){
		client.remove(req.body.magneturi, (err) => {
			res.json({msn: 'Torrent removido.'});
		});
	}else{
		res.json({error: 'Torrent encontrado.'});
	}

});

app.get('/torrent/video/:magneturi', (req, res) => {

	if(client.get(req.params.magneturi)){

	 	client.get(req.params.magneturi).files.forEach(function (file) {

	 		const movieFile = path.normalize(client.get(req.params.magneturi).path+'/'+file.path);

	 		fs.stat(movieFile, (err, stats) => {
			    
			    if (err) {
			       console.log(err);
			       return res.status(404).end('<h1>Movie Not found</h1>');
			    }
	 		
		 		const { range } = req.headers;
			    const { size } = stats;
			    const start = Number((range || '').replace(/bytes=/, '').split('-')[0]);
			    const end = size - 1;
			    const chunkSize = (end - start) + 1;

			    res.set({
			       'Content-Range': `bytes ${start}-${end}/${size}`,
			       'Accept-Ranges': 'bytes',
			       'Content-Length': chunkSize,
			       'Content-Type': 'video/mp4'
			    });

			    res.status(206);

			    const stream = fs.createReadStream(movieFile, { start, end });
	     		stream.on('open', () => stream.pipe(res));
	     		stream.on('error', (streamErr) => res.end(streamErr));

	     	});

		});

	}else{
		res.json({error: 'Torrent encontrado.'});
	}


});

app.listen(3000, function () {
  console.log('run...');
});