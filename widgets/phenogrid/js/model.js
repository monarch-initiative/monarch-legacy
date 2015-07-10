// CommonJS format
module.exports = {
	// In JavaScript, a function is an object, and can be used to construct objects with the new operator - Joe
	// Creation of modelDataPoint object
	modelDataPoint: function(x, y) {
		this.xID = x;
		this.yID = y;
	},

	// Makes sure that matches are when both the X & Y values are the same
	modelDataPointEquals: function(point1, point2) {
		return point1.xID === point2.xID && point1.yID === point2.yID;
	},

	// Prints the point in a easy to understand way
	modelDataPointPrint: function(point) {
		return "X:" + point.xID + ", Y:" + point.yID;
	}
}



