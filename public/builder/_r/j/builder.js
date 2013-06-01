var Builder = {};

Builder.textConversionVals = {
	_: 0,
	A: 10,
	B: 20,
	C: 30,
	D: 40,
	E: 50,
	F: 60,
	G: 70,
	H: 80,
	I: 90,
	J: 100,
	K: 110,
	L: 120,
	M: 130,
	N: 140,
	O: 150,
	P: 160,
	Q: 170,
	R: 180,
	S: 190,
	T: 200,
	U: 210,
	V: 220,
	W: 230,
	X: 240,
	Y: 250,
	Z: 255
};

Builder.previewContainerWidth = 0;

Builder.node = function(title, colors, width) {
	this.title = title;
	this.colors = {
		red: null,
		green: null,
		blue: null
	};
	this.width = width;
};

Builder.collection = [];

Builder.attachEvents = function() {
	$("button#add-node").on('click', function(e){
		e.preventDefault;
		Builder.addNode();
	});
	$("button#remove-node").on('click', function(e){
		e.preventDefault;
		Builder.removeNode();
	});
	$("button#render").on('click', function(e){
		e.preventDefault;
		Builder.render();
	});
	$("button#reset").on('click', function(e){
		e.preventDefault;
		Builder.resetForm();
	});
};

Builder.addNode = function() {
	var inputTextVal = $("#input-text").val();
	var inputTimeVal = $("#input-time").val();
	if (!inputTextVal || !inputTimeVal) {
		$(".error").show();
	} else {
		$(".error").hide();
		Builder.convert(inputTextVal, inputTimeVal);
	}
};

Builder.removeNode = function() {
	var arrayLength = Builder.collection.length - 1;
	Builder.previewContainerWidth = Builder.previewContainerWidth - Builder.collection[arrayLength].width;
	Builder.collection.pop();
	$("#preview div").last().remove();
	$("#preview").css('width', Builder.previewContainerWidth);
};

Builder.init = function() {
	Builder.colorInput = {
		red: null,
		green: null,
		blue: null
	};
	Builder.splitArrays = {
		red: [],
		green: [],
		blue: []
	};
	Builder.convertedArrays = {
		red: [],
		green: [],
		blue: []
	}
	Builder.finalRGBVals = {
		red: null,
		green: null,
		blue: null
	}
};
	
Builder.convert = function(inputTextVal, inputTimeVal) {
	Builder.init();

	//create new node
	var currentNode = new Builder.node();

	//convert to uppercase and replace spaces with underscores
	inputTextVal = inputTextVal.toUpperCase().replace(/ /g, "_");
	//remove all non alpha characters
	convertedVal = inputTextVal.replace(/[^A-Z_]/gi,"");
	currentNode.title = convertedVal;
	//return modulo of length
	remainder = convertedVal.length % 3;
	
	sliceIndex = Math.floor(convertedVal.length / 3);

	//figure out string slices
	if (remainder === 1) {
		Builder.colorInput.red = convertedVal.slice(0, sliceIndex);
		Builder.colorInput.green = convertedVal.slice(sliceIndex, (sliceIndex * 2) + 1);
		Builder.colorInput.blue = convertedVal.slice((sliceIndex * 2) + 1, (sliceIndex * 3) + 1);
	} else if (remainder === 2) {
		Builder.colorInput.red = convertedVal.slice(0, sliceIndex + 1);
		Builder.colorInput.green = convertedVal.slice(sliceIndex + 1, (sliceIndex * 2) + 1);
		Builder.colorInput.blue = convertedVal.slice((sliceIndex * 2) + 1, (sliceIndex * 3) + 2);
	} else {
		Builder.colorInput.red = convertedVal.slice(0, sliceIndex);
		Builder.colorInput.green = convertedVal.slice(sliceIndex, sliceIndex * 2);
		Builder.colorInput.blue = convertedVal.slice(sliceIndex * 2, sliceIndex * 3);
	}

	//split colorInput nodes into arrays of individual characters
	for (var key in Builder.colorInput) {
		var prop = Builder.colorInput[key];
		Builder.splitArrays[key] = prop.split("");

		//convert splitArrays to integers
		for (i=0; i < Builder.splitArrays[key].length; i++) {
			Builder.convertedArrays[key].push(Builder.textConversionVals[Builder.splitArrays[key][i]]);
		}
	}
	
	//Average values in convertedArrays for final RGB values
	for (var key in Builder.convertedArrays) {
		var finalVal = 0;
		for (i=0; i < Builder.convertedArrays[key].length; i++) {
			finalVal = finalVal + Builder.convertedArrays[key][i];
		}
		//add RGB values to node
		currentNode.colors[key] = Math.round(finalVal / Builder.convertedArrays[key].length);
	}		

	//calculate node width
	splitVal = inputTimeVal.split(":");
	var previewWidth = (splitVal[0] * 100) + Math.round((splitVal[1] / 60) * 100);
	Builder.previewContainerWidth = Builder.previewContainerWidth + previewWidth;
	
	//set width property of currentNode to previewContainerWidthWidth
	currentNode.width = previewWidth;

	Builder.collection.push(currentNode);
	$("#preview").css('width', Builder.previewContainerWidth).append('<div id="' + currentNode.title + '" style="width:' + currentNode.width + 'px; background-color:rgb(' + currentNode.colors.red + ',' + currentNode.colors.green + ',' + currentNode.colors.blue + ');"></div>');
};

Builder.render = function() {
	$("#code-output").text("");
	$("#image-output").html("");
	var fullWidth = $("#preview").width();
	var fullHeight = $("#image-height").val();
	if (!fullHeight) {
		fullHeight = 100;
	}
	var imageType = $("#image-type").val();
	if (!imageType) {
		imageType = "png";
	}
	var startSVG = '<?xml version="1.0" encoding="utf-8"?><svg version="1.2" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="' + fullWidth + 'px" height="' + fullHeight + 'px" xml:space="preserve"><g id="rendered-output">';
	var endSVG = '</g></svg>';
	var currentX = 0;
	var renderedNodes = [];

	for(i=0; i < Builder.collection.length; i++) {
		renderedNodes += '<rect x="' + currentX + '" fill="rgb(' + Builder.collection[i].colors.red + ', ' + Builder.collection[i].colors.green + ', ' + Builder.collection[i].colors.blue + ')" width="' + Builder.collection[i].width + '" height="' + fullHeight + '"/>';
		currentX = currentX + Builder.collection[i].width;
	}

	var canvasOutput = startSVG + renderedNodes + endSVG;
	var codeOutput = canvasOutput.replace(/</g, '&lt;').replace(/>/g, '&gt;');

	$("#code-output").append(codeOutput);
 	canvg('canvas-output', canvasOutput);
 	var canvas = document.getElementById("canvas-output");
 	var renderedImg = canvas.toDataURL("image/" + imageType);
 	$("#image-output").html('<img src="' + renderedImg + '">');

 	$(".instructions").show();
 	$("#code-output").css('display', 'block');
};

Builder.resetForm = function() {
	Builder.previewContainerWidth = 0;
	Builder.collection.length = 0;
	$("input[type='text']").val("");
	$("#code-output").text("");
	$("#preview, #image-output").html("");
	$("#preview").css("width", 0);
	$("#code-output, .instructions").hide();
};

$(document).ready(function () { 
	Builder.attachEvents();
});