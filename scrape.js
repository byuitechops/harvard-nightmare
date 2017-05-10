var Nightmare = require('nightmare'),
    fs = require("fs");
var vo = require('vo');

// TODO: GET URL LIST FROM WHATEVER CSV/JSON/WHATEVER WE ARE GETTING THEM FROM
var urlList = ["https://content.byui.edu/file/3f25ecb2-3c08-4dd6-b1f1-06f0bfea25c9/1/715044p2.pdf", "https://content.byui.edu/file/3f25ecb2-3c08-4dd6-b1f1-06f0bfea25c9/1/715044p2.pdf", "https://content.byui.edu/file/3f25ecb2-3c08-4dd6-b1f1-06f0bfea25c9/1/715044p2.pdf"]
//CONVERTED URLS
var newUrlList = []; // Do we need this anywhere?
var selector = "#adjacentuls ul li:nth-child(2) span"

vo(run)(function (err, result) {
    if (err) throw err
})



function * run() {
    // CLEAR OUT THE RESPONSES FILE
    fs.writeFile("responses.txt", "", function (err) {
        if (err) throw err
    });

    // SET UP THE NIGHTMARE
    var nightmare = Nightmare({
        show: true,
        typeInterval: 20,
        alwaysOnTop: false,
        waitTimeout: 20 * 60 * 1000
    });

    // GO AND DO
    for (var i = 0; i < urlList.length; i++) {
        var destination = fixURL(urlList[i]);
        newUrlList.push(destination); // Adds the fixed url to the newUrlList array
        //        console.log(newUrlList);
        //        console.log(destination);
        yield nightmare
            .goto(destination)
            .wait(selector)
            .evaluate(function (selector) {
                // gets the data from the "owner" section.
                function Console() {
                    this.message = [];
                    this.prototype.log = function (data) {
                        message.push(data);
                    }
                }
                return {
                    log: Console.message,
                    doc: document.querySelector(selector).innerHTML
                };
            }, selector)
            .then(function (response) {
                console.log(typeof response.doc)
                    //Adds the response to a txt document - TODO: make csv's instead
                fs.appendFile("responses.txt", "Page URL: " + destination + " | Owner: " + response.doc + "\n", function (err) {
                    if (err) throw err
                })
            })
            .catch(function (error) {
                console.error(error);

            });
    }
    yield nightmare.end()
}

// Resolves .pdf links to equella item pages
function fixURL(destination) {
    var fileid = destination.split("/")[4]; //Grabs the file name.
    var newUrl = "https://content.byui.edu/items/" + fileid + "/0/";
    return newUrl;
}
