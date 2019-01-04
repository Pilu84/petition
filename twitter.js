const https = require("https");
// const secrets = require("./secret.json");

module.exports.getToken = function getToken(cb) {
    //will go to Twitter API to get bearer token
    var concatenatedCreds =
        process.env.consumerKey + ":" + process.env.consumerSecret;

    // var concatenatedCreds = secrets.consumerKey + ":" + secrets.consumerSecret;
    var encodedCreds = new Buffer(concatenatedCreds).toString("base64");

    let options = {
        method: "POST",
        host: "api.twitter.com",
        path: "/oauth2/token",
        headers: {
            Authorization: "Basic " + encodedCreds,
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        }
    };

    let callback = resp => {
        if (resp.statusCode != 200) {
            cb(resp.statusCode);
            return;
        }

        let body = "";

        resp.on("data", chunk => {
            body += chunk;
        });

        resp.on("end", () => {
            let parsedBody = JSON.parse(body);
            let bearerToken = parsedBody.access_token;
            cb(null, bearerToken);
        });
    };

    const req = https.request(options, callback);
    req.write("grant_type=client_credentials");
    req.end();
};

module.exports.getTweets = function getTweets(bToken, cb) {
    let options = {
        method: "GET",
        host: "api.twitter.com",
        path:
            "/1.1/statuses/user_timeline.json?screen_name=KitakriseBerlin&tweet_mode=extended",
        headers: {
            Authorization: "Bearer " + bToken
        }
    };

    let callback = resp => {
        if (resp.statusCode != 200) {
            cb(resp.statusCode);
            return;
        }

        let body = "";

        resp.on("data", chunk => {
            body += chunk;
        });

        resp.on("end", () => {
            let parsedBody = JSON.parse(body);
            cb(null, parsedBody);
        });
    };

    const req = https.request(options, callback);
    req.end();
    //will go to twitter api to get tweet from news source of you choose
};

module.exports.filterTweets = function filterTweets(tweets) {
    var tweetForWrite = [];

    tweets.sort(function(a, b) {
        return new Date(b.created_at) - new Date(a.created_at);
    });

    for (var i = 0; i < tweets.length; i++) {
        var cleanLink = tweets[i].full_text.split(" https://");
        if (tweets[i].entities.urls.length != 0) {
            tweetForWrite.push({
                linkname: cleanLink[0] + " (" + tweets[i].user.name + ")",
                url_link: tweets[i].entities.urls[0].url
            });
        } else {
            tweetForWrite.push({
                linkname: cleanLink[0] + " (" + tweets[i].user.name + ")",
                url_link: "https://twitter.com/KitakriseBerlin"
            });
        }
    }

    return tweetForWrite;
};
