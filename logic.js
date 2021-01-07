var express = require('express');
var app = express();
var PORT = 3000;
var math = require('mathjs');
var csvParser = require('csv-parser');
var fs = require('fs');
const e = require('express');

var carats = [];
var cuts = [];
var colors = [];
var clarities = [];
var lengths = [];
var depths = [];
var widths = [];
var volumes = [];
var y = [];
var x = [];
var b = [];

app.get('/', function(req, res) {
    res.end('<html><head><meta charset="UTF-8"></head><body><table><tr><td>carat: </td><td><input type="text" name="carat" id="carat"></td></tr><tr><td>cut: </td><td><select name="cut" id="cut"><option value="Fair">Fair</option><option value="Good">Good</option><option value="Very Good">Very Good</option><option value="Premium">Premium</option><option value="Ideal">Ideal</option></select></td></tr><tr><td>clarity: </td><td><select name="clarity" id="clarity"><option value="I1">I1</option><option value="SI2">SI2</option><option value="SI1">SI1</option><option value="VS2">VS2</option><option value="VS1">VS1</option><option value="VVS2">VVS2</option><option value="VVS1">VVS1</option><option value="IF">IF</option></select></td></tr><tr><td>color: </td><td><select name="color" id="color"><option value="J">J</option><option value="I">I</option><option value="H">H</option><option value="G">G</option><option value="F">F</option><option value="E">E</option><option value="D">D</option></select></td></tr><tr><td>length: </td><td><input type="text" name="length" id="length"></td></tr><tr><td>depth: </td><td><input type="text" name="depth" id="depth"></td></tr><tr><td>width: </td><td><input type="text" name="width" id="width"></td></tr><tr><td><button onclick="calculate()">Predict</button></td></tr></table><script>function calculate() {let carat = document.getElementById("carat").value;let cut = document.getElementById("cut").value;let clarity = document.getElementById("clarity").value;let color = document.getElementById("color").value;let length = document.getElementById("length").value;let depth = document.getElementById("depth").value;let width = document.getElementById("width").value;window.location.replace("http://localhost:3000/calculate?carat=" + carat + "&cut=" + cut + "&clarity=" + clarity + "&color=" + color + "&length=" + length + "&depth=" + depth + "&width=" + width);}</script></body></html>');
});

app.get('/calculate', function(req, res) {
    let carat = Number(req.query.carat);
    let cut = req.query.cut;
    let clarity = req.query.clarity;
    let color = req.query.color;
    let length = Number(req.query.length);
    let depth = Number(req.query.depth);
    let width = Number(req.query.width);
    let volume = length * depth * width;

    let cut_list = ["Fair", "Good", "Very Good", "Premium", "Ideal"];
    let clarity_list = ["I1", "SI2", "SI1", "VS2", "VS1", "VVS2", "VVS1", "IF"];
    let color_list = ["J", "I", "H", "G", "F", "E", "D"];

    cut = cut_list.indexOf(cut) + 1;
    clarity = clarity_list.indexOf(clarity) + 1;
    color = color_list.indexOf(color) + 1;

    let price = b[0][0] + b[1][0] * carat + b[2][0] * cut + b[3][0] * clarity + b[4][0] * color + b[5][0] * volume;
    console.log("carat: " + carat);
    console.log("cut: " + cut);
    console.log("clarity: " + clarity);
    console.log("color: " + color);
    console.log("length: " + length);
    console.log("depth: " + depth);
    console.log("width: " + width);
    console.log("volume: " + volume);
    console.log("Price: " + price);
    res.end('<html><head><meta charset="UTF-8"></head><body><a href="http://localhost:3000"><< Back</a><h1>Predicted Price: $' + price.toFixed(2) + '</h1><h3>Exact: $' + price + '</h3></body></html>');

});

app.listen(PORT, function() {
    console.log('Server is running on PORT:', PORT);
});

fs.createReadStream("diamonds.csv")
    .pipe(csvParser())
    .on("data", (row) => {
        carats.push(Number(row.carat));
        cuts.push(row.cut);
        colors.push(row.color);
        clarities.push(row.clarity);
        lengths.push(Number(row.x));
        depths.push(Number(row.y));
        widths.push(Number(row.z));
        volumes.push(Number(row.x) * Number(row.y) * Number(row.z));
        y.push([Number(row.price)]);
    }).on("end", () => {
        console.log("CSV Processed");
        createRegressionModel();
        calculateRSquared();
        // debug();
    });

function createRegressionModel() {
    // data conversions
    let cut_list = ["Fair", "Good", "Very Good", "Premium", "Ideal"];
    let color_list = ["J", "I", "H", "G", "F", "E", "D"];
    let clarity_list = ["I1", "SI2", "SI1", "VS2", "VS1", "VVS2", "VVS1", "IF"];
    for (let i = 0; i < carats.length; i++) {
        cuts[i] = cut_list.indexOf(cuts[i]) + 1;
        colors[i] = color_list.indexOf(colors[i]) + 1;
        clarities[i] = clarity_list.indexOf(clarities[i]) + 1;
    }

    // building matrices
    for (let i = 0; i < volumes.length; i++) {
        let tempArrs = [];

        tempArrs.push(1);
        tempArrs.push(carats[i]);
        tempArrs.push(cuts[i]);
        tempArrs.push(clarities[i]);
        tempArrs.push(colors[i]);
        tempArrs.push(volumes[i]);

        x.push(tempArrs);
    }

    // build regression model
    var xTranspose = math.transpose(x);
    var xInverse = math.inv(math.multiply(xTranspose, x));
    b = math.multiply(math.multiply(xInverse, xTranspose), y);
    console.log("y: ");
    console.log(y);
    console.log("x: ");
    console.log(x);
    console.log("b: ");
    console.log(b);
    console.log("Regression model is:");
    console.log("(price) = ", b[0][0], " + ", b[1][0], "(carat) + ", b[2][0], "(cut) + ", b[3][0], "(clarity) + ", b[4][0], "(color) + ", b[5][0], "(volume)");
}

function calculateRSquared() {
    // get average of actual price
    let Yavg = 0;
    for (let i = 0; i < y.length; i++) {
        Yavg += y[i][0];
    }
    Yavg /= y.length;

    // get sum of y and Yavg difference squared
    let actualSquared = 0;
    for (let i = 0; i < y.length; i++) {
        actualSquared += ((y[i][0] - Yavg) * (y[i][0] - Yavg));
    }

    // get sum of predicted price and Yavg difference squared
    let predictedSquared = 0;
    for (let i = 0; i < y.length; i++) {
        let price = b[0][0] + b[1][0] * carats[i] + b[2][0] * cuts[i] + b[3][0] * clarities[i] + b[4][0] * colors[i] + b[5][0] * volumes[i];
        predictedSquared += ((price - Yavg) * (price - Yavg));
    }

    // get R Squared
    let rSquared = 1 - (predictedSquared / actualSquared);
    console.log("Predicted Variance: ", predictedSquared);
    console.log("Total Variance: ", actualSquared);
    console.log("R-Squared: ", rSquared, "(", (rSquared * 100).toFixed(2), "%)");
}

function debug()
{
    console.log(carats);
    console.log(cuts);
    console.log(colors);
    console.log(clarities);
    console.log(lengths);
    console.log(widths);
    console.log(depths);
    console.log(volumes);
    console.log(y);
    console.log(x);
    console.log(b);
}