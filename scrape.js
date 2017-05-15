var Nightmare = require('nightmare'),
    fs = require("fs");
var vo = require('vo');
var dsv = require('d3-dsv');
var $ = require("jquery");
//GRAB USERNAME AND PASSWORD TO AUTHENTICATE
var authData = JSON.parse(fs.readFileSync("./auth.json"));

var data = JSON.parse(fs.readFileSync("./source.json")); //reads the information from the source file
var urlList = [];
//Populate urlList
for (var i = 0; i < data.length; i++)
    urlList.push(data[i].URL);

//The element on the pages that contains "Owner:"
var selector = "#adjacentuls ul"

// Function factory runner.
vo(run)(function (err, result) {
    if (err) throw err
})


function* run() {
    // CLEAR OUT THE RESPONSES FILE
    fs.writeFile("responses.json", "", function (err) {
        if (err) throw err
    });

    // SET UP THE NIGHTMARE
    var nightmare = Nightmare({
        show: true, //switch to true to debug
        typeInterval: 20,
        alwaysOnTop: false,
        waitTimeout: 20 * 60 * 1000
    });

    //LOG INTO BRIGHTSPACE SO THAT YOU HAVE BEEN AUTHENTICATED FOR LATER
    yield nightmare
        .goto('https://secure.byui.edu/cas/login?service=https://web.byui.edu/Services/Login/?RedirectURL=https%3a%2f%2fmy.byui.edu%2f')
        .type("#username", authData.username)
        .type("#password", authData.password)
        .click("input.btn-login")
    //This wait used to wait for byui's home page to load. Now it doesn't. Re-write wait if you get auth errors.
        .wait(250)
        .catch(function (error) {
            console.error(error);
        });

    // GO AND DO
    for (var i = 0; i < urlList.length; i++) {
        //Find where the nightmare is SUPPOSED to go based on file URLs
        var destination = fixURL(urlList[i]);
        yield nightmare
            .goto(destination)
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
                    // Looks for the "Owner" li and saves everything after "Owner: "
                    doc: $(selector + " li:contains(Owner)").text().split(": ")[1] //THIS IS LITERALLY THE ONLY LINE THAT USES JQUERY.
                };
            }, selector)
            .then(function (response) {

                console.log("Owner of file " + (i + 1)+ ": " + response.doc)
                    //APPENDS THE "OWNER" TO SOURCE DATA
                data[i]["OWNER"] = response.doc;
            })
            .catch(function (error) {
                console.error(error);
            });
    }
    yield nightmare.end()
    //EXPORT THE SCRAPED OWNERS TO A FILE
    fs.writeFile("responses.json", JSON.stringify(data), function (err) {
        if (err) throw err
    })
}

// RESOLVES THE LINK URLs TO PAGES THAT NEED TO BE SCRAPED
function fixURL(destination) {
    var fileid = destination.split("/")[4]; //Grabs the file name.
	fileid = fileid=='gen' ? destination.split("/")[5] : fileid
    var newUrl = "https://content.byui.edu/items/" + fileid + "/0/";
    return newUrl;
}
