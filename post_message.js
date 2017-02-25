/**
 * Posts a received message to the bot for processing.
 * Message can be read from STDIN or file.
 */
var log = require("npmlog");
var config = require("config");
var fs = require("fs");
var request = require("request");

process.argv = process.argv.splice(2);

if (process.argv.length === 0) {
    log.info("post_message", "Using stdin as email source");

    var data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on('readable', () => {
        var chunk = process.stdin.read();
        if (chunk !== null) {
            data += chunk;
        }
    });
    process.stdin.on('end', () => {
        postMessage(data);
    });
} else {
    log.info("post_message", "Attempting to read from file: " + process.argv[0]);
    fs.readFile(process.argv[0], 'utf8', function (err, data) {
        if (err) {
            log.error("post_message", "File read error");
            log.error("post_message", err);
            process.exit(1);
        } else {
            postMessage(data);
        }
    });
}

function postMessage(body) {
    var options = {
        url: "http://localhost:" + config.get("web.port") + "/_m.email/api/v1/message",
        method: "POST",
        headers: {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(body)
        },
        qs: {
            secret: config.get("web.secret")
        },
        body: body
    };

    request(options, function (err, response, body) {
        if (err) {
            log.error("post_message", "Error calling bot to post message");
            log.error("post_message", err);
            process.exit(2);
        } else {
            log.info("post_message", body);
            if (response.statusCode >= 200 && response.statusCode < 300) {
                log.info("post_message", "Message processed");
                process.exit(0);
            } else {
                log.warn("post_message", "Status Code = " + response.statusCode);
                process.exit(3);
            }
        }
    });
}