var Nightmare = require('nightmare'),
    fs = require("fs");
var vo = require('vo');
var dsv = require('d3-dsv');
var $ = require("jquery");
//GRAB USERNAME AND PASSWORD TO AUTHENTICATE
var authData = JSON.parse(fs.readFileSync("./auth.json"));

// TODO: GET URL LIST FROM WHATEVER CSV/JSON/WHATEVER WE ARE GETTING THEM FROM
var urlList = ["https://content.byui.edu/file/2d0cff20-0552-46df-ae0f-bd360834dc98/1/717416p2.pdf", "https://content.byui.edu/file/3f25ecb2-3c08-4dd6-b1f1-06f0bfea25c9/1/715044p2.pdf", "https://content.byui.edu/file/8320da89-1b6d-4e0f-b4cc-166fda60a418/1/817031p2.pdf","https://content.byui.edu/file/aa9b6af5-b882-48f5-8321-caca980e5ec9/1/lesson%203%20Readings%20and%20tutorials.pdf","https://content.byui.edu/file/aa9b6af5-b882-48f5-8321-caca980e5ec9/1/Lesson%203%20Components%20and%20Databinding.pdf"]
//CONVERTED URLS
var newUrlList = []; // Do we need this anywhere?
var selector = "#adjacentuls ul"

vo(run)(function (err, result) {
    if (err) throw err
})


function * run() {
    // CLEAR OUT THE RESPONSES FILE
    fs.writeFile("responses.json", "", function (err) {
        if (err) throw err
    });

    // SET UP THE NIGHTMARE
    var nightmare = Nightmare({
        show: false,//switch to true to debug
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
        .wait(function () {
            //go to d2l home
            console.log("Waiting");
            return document.location.href === "https://my.byui.edu/ics";
        })
        .catch(function (error) {
            console.error(error);
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
                    doc: $(selector + " li:contains(Owner)").text() //the only line of jquery
                };
            }, selector)
            .then(function (response) {

                console.log(typeof response.doc)
                    //Adds the response to a txt document - TODO: make csv's instead
                fs.appendFile("responses.json", "{PageURL: " + JSON.stringify(destination) + ", " + response.doc + "}, \n", function (err) {
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
