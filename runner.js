/**
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

'use strict';

var	nconf = require('nconf'),
    fs = require('fs'),
    url = require('url'),
    path = require('path'),
    fork = require('child_process').fork,

    async = require('async'),
    logrotate = require('logrotate-stream'),

    pkg = require('./package.json'),

    pidFilePath = __dirname + '/pidfile',
    output = logrotate({ file: __dirname + '/logs/app.log', size: '1m', keep: 3, compress: true }),
    silent = process.env.NODE_ENV !== 'development',
    numProcs,
    workers = [],

    Runner = {
        timesStarted: 0
    };

Runner.init = function(callback) {
    if (silent) {
        console.log = function(value) {
            output.write(value + '\n');
        };
    }

    process.on('SIGHUP', Runner.restart);
    process.on('SIGUSR2', Runner.reload);
    process.on('SIGTERM', Runner.stop);
    callback();
};

Runner.addWorkerEvents = function(worker) {
    worker.on('exit', function(code, signal) {
        if (code !== 0) {
            if (Runner.timesStarted < numProcs*3) {
                Runner.timesStarted++;
                if (Runner.crashTimer) {
                    clearTimeout(Runner.crashTimer);
                }
                Runner.crashTimer = setTimeout(function() {
                    Runner.timesStarted = 0;
                }, 10000);
            } else {
                console.log(numProcs*3 + ' restarts in 10 seconds, most likely an error on startup. Halting.');
                process.exit();
            }
        }

        console.log('[cluster] Child Process (' + worker.pid + ') has exited (code: ' + code + ', signal: ' + signal +')');
        if (!(worker.suicide || code === 0)) {
            console.log('[cluster] Spinning up another process...');

            forkWorker(worker.index, worker.isPrimary);
        }
    });

    worker.on('message', function(message) {
        if (message && typeof message === 'object' && message.action) {
            switch (message.action) {
                case 'restart':
                    console.log('[cluster] Restarting...');
                    Runner.restart();
                    break;
                case 'reload':
                    console.log('[cluster] Reloading...');
                    Runner.reload();
                    break;
            }
        }
    });
};

Runner.start = function(callback) {
    numProcs = getPorts().length;
    console.log('Clustering enabled: Spinning up ' + numProcs + ' process(es).\n');

    for (var x=0; x<numProcs; ++x) {
        forkWorker(x, x === 0);
    }

    if (callback) {
        callback();
    }
};

function forkWorker(index, isPrimary) {
    var ports = getPorts();

    if(!ports[index]) {
        return console.log('[cluster] invalid port for worker : ' + index + ' ports: ' + ports.length);
    }

    process.env.isPrimary = isPrimary;
    process.env.isCluster = true;
    process.env.port = ports[index];

    var worker = fork('app.js', [], {
        silent: silent,
        env: process.env
    });

    worker.index = index;
    worker.isPrimary = isPrimary;

    workers[index] = worker;

    Runner.addWorkerEvents(worker);

    if (silent) {
        var output = logrotate({ file: __dirname + '/logs/app.log', size: '1m', keep: 3, compress: true });
        worker.stdout.pipe(output);
        worker.stderr.pipe(output);
    }
}

function getPorts() {
    var urlObject = url.parse(nconf.get('url'));
    var port = nconf.get('port') || nconf.get('PORT') || urlObject.port || 8118;
    if (!Array.isArray(port)) {
        port = [port];
    }
    return port;
}

Runner.restart = function() {
    killWorkers();

    Runner.start();
};

Runner.reload = function() {
    workers.forEach(function(worker) {
        worker.send({
            action: 'reload'
        });
    });
};

Runner.stop = function() {
    killWorkers();

    // Clean up the pidfile
    fs.unlinkSync(__dirname + '/pidfile');
};

function killWorkers() {
    workers.forEach(function(worker) {
        worker.suicide = true;
        worker.kill();
    });
}

Runner.notifyWorkers = function(msg, worker_pid) {
    worker_pid = parseInt(worker_pid, 10);
    workers.forEach(function(worker) {
        if (parseInt(worker.pid, 10) !== worker_pid) {
            try {
                worker.send(msg);
            } catch (e) {
                console.log('[cluster/notifyWorkers] Failed to reach pid ' + worker_pid);
            }
        }
    });
};

nconf.argv().file({
    file: path.join(__dirname, '/config.json')
});

if (nconf.get('daemon') !== false) {
    if (fs.existsSync(pidFilePath)) {
        try {
            var	pid = fs.readFileSync(pidFilePath, { encoding: 'utf-8' });
            process.kill(pid, 0);
            process.exit();
        } catch (e) {
            fs.unlinkSync(pidFilePath);
        }
    }

    require('daemon')({
        stdout: process.stdout,
        stderr: process.stderr
    });

    fs.writeFile(__dirname + '/pidfile', process.pid);
}

async.series([
    Runner.init,
    Runner.start
], function(err) {
    if (err) {
        console.log('[runner] Error during startup: ' + err.message);
    }
});