$(function () {
    function loadScript() {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBMy3adhASc_MgT2DMdaZ5LEg07uKqcZks&sensor=true&callback=getLocation";
        document.body.appendChild(script);
    }

    loadScript();
    $.getJSON('http://travelsaver.azurewebsites.net/api/fuel/get?country=' + country, function (data) {fuelPriceInCountry = data.Petrol;});
    getCurrencies();
    var today = new Date();
    var tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    $('#hotelFrom').val(dateToYMD(today));
    $('#hotelTo').val(dateToYMD(tomorrow));


	$('.scrollBtn').bind('click', function() {
	    var destinationSlide = $(this).attr('href');
	    var destinationSlidePosition = $(destinationSlide).attr('data-leftscroll');


	    $('#screenContainer').css('left', destinationSlidePosition);

	    if (destinationSlide === '#results') {
	        var slideResultContent = $(this).attr('data-content');

	        $('#results > div').hide();
	        $('#' + slideResultContent).show();
	    }
	    return false;
	});

	$('#searchBtn').bind('click', function () { getDirections(); });
	//$('#locationTo').bind('keydown', function (e) {
	//    if (e.which == 13) {
	//        getDirections();
	//    }
	//});

	$('#compactCar').bind('click', function () { recalculateFuelValues(5);});
	$('#conventionalCar').bind('click', function () { recalculateFuelValues(10); });
	$('#highConsumptionCar').bind('click', function () { recalculateFuelValues(15); });

	$('.chooser dd').bind('click', function() {
		$('.chooser dd').removeClass('selected');
		$(this).addClass('selected');
	});

	$('#amount').keyup(function () {	    
	    calculateCurrencies();
	});

	$('#calculatorOptions dd').bind('click', function () { calculateCurrencies(); });

	$('#hotelTo').change(function () { getHotels(); });
});

var route = null;
var distance = 0;
var fuelPriceInCountry = 5.55;
var country = 'Poland';

function calculateCurrencies()
{
    var mainCurrency = $('#calculatorOptions dd.selected').text();
    var amount = $('#amount').val();
    if (isNaN(amount)) return;
    $('#calculatorPLN').text(convertCurrencies(mainCurrency, 'PLN', amount));
    $('#calculatorEUR').text(convertCurrencies(mainCurrency, 'EUR', amount));
    $('#calculatorUSD').text(convertCurrencies(mainCurrency, 'USD', amount));
    $('#calculatorGBP').text(convertCurrencies(mainCurrency, 'GBP', amount));
}

function getDirections() {
    var from = $('#from').text();
    var to = $('#locationTo').val();
    $('.destination').text(to);
    route = $.getJSON('http://maps.googleapis.com/maps/api/directions/json?origin=' + from + '&destination=' + to + '&sensor=false', function (data) {
        var parsedRoute = JSON.parse(route.responseText);
        if (parsedRoute.routes[0] == undefined)
            alert('Route not found!');
        distance = parseInt(parsedRoute.routes[0].legs[0].distance.value / 1000);
        $('#compactCar').attr('class', 'selected');
        $('#compactCar ~ dd').removeAttr('class');
        recalculateFuelValues(5);
        $('.time').val(parsedRoute.routes[0].legs[0].duration.text.replace('hours', 'h'));
        $('.distance').val(parsedRoute.routes[0].legs[0].distance.text);
        getRestaurants();
        getHotels();
        //return parsedRoute.routes[0].legs[0];
    });
}
function getCurrencies() {
    $.ajax({
        url: 'http://travelsaver.azurewebsites.net/api/currency/get',
        dataType: 'json',
        success: function (json) {
            fx.rates = json.rates;
            fx.base = json.base;
            $('#literPln').text(fuelPriceInCountry);
            $('#literEur').text(convertCurrencies('PLN', 'EUR', fuelPriceInCountry));
            $('#literUsd').text(convertCurrencies('PLN', 'USD', fuelPriceInCountry));
            $('#literGbp').text(convertCurrencies('PLN', 'GBP', fuelPriceInCountry));
        }
    });
}

function recalculateFuelValues(amount) {
    var amountInPln = (((distance / 100) * amount) * fuelPriceInCountry).toFixed(2);
    $('#carPln').text(amountInPln);
    $('#carEur').text(convertCurrencies('PLN', 'EUR', amountInPln));
    $('#carUsd').text(convertCurrencies('PLN', 'USD', amountInPln));
    $('#carGbp').text(convertCurrencies('PLN', 'GBP', amountInPln));
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        $('#from').text('Barcelona');
    }
}

function showPosition(position) {
    getCity(position.coords.latitude, position.coords.longitude, '#from');
}

function showError(error) {
    $('#from').text('Barcelona');
}

function convertCurrencies(currencyA, currencyB, amount) {
    return fx.convert(amount, { from: currencyA.toUpperCase(), to: currencyB.toUpperCase() }).toFixed(2);
}

function getCountry(lat, lng) {
    var latlng = new google.maps.LatLng(lat, lng);
    var geoCoder = new google.maps.Geocoder();

    geoCoder.geocode({
        location: latlng
    }, function (results, statusCode) {
        var lastResult = results.slice(-1)[0];
        if (statusCode == 'OK' && lastResult && 'address_components' in lastResult) {
            country = lastResult.address_components.slice(-1)[0].long_name;
            return country;
        } else {
            return 'Poland';
        }
    });
};

function getCity(lat, lng, element) {
    var latlng = new google.maps.LatLng(lat, lng);
    var geoCoder = new google.maps.Geocoder();

    geoCoder.geocode({
        location: latlng
    }, function (results, statusCode) {
        var lastResult = results.slice(-1)[0];
        if (statusCode == 'OK' && lastResult && 'address_components' in lastResult) {
            $.each(results[0].address_components, function (i, item) {
                if (item.types[0] == "locality") {
                    $(element).text(item.long_name);
                }
            });
            return 'Error';
        } else {
            return 'Barcelona';
        }
    });
}

function getHotels()
{
    var fromDate = $('#hotelFrom').val();
    var toDate = $('#hotelTo').val();
    $('#hotelsList').empty();
    $.getJSON('http://travelsaver.azurewebsites.net/api/hotels/get/?fromDate=' + fromDate + '&toDate='+toDate+'&city=' + $('#locationTo').val() + '&currency=EUR', function (data) {
        $.each(data, function (i, hotel) {
            $('#hotelsList').append('<li title="Description: ' + (hotel.shortDescription == null ? 'Not provided!' : hotel.shortDescription) + '... Address: ' + hotel.address1 + '"><a target="_blank" href="http://travel.ian.com/hotel/propertydetails/' + hotel.hotelId + '/SUMMARY?isHRN=true&cid=55505">' + hotel.name + ' ' + hotel.hotelRating + '*' + ' </a><strong class="result" title="Tripadvisor rating">' + hotel.tripAdvisorRating + '</strong></li>');
        });
    });
}


function getRestaurants() {
    $('#restaurantsList').empty();
    $.getJSON('http://travelsaver.azurewebsites.net/api/restaurants/get/?city=' + $('#locationTo').val(), function (data) {
        $.each(data, function (i, restaurant) {
            $('#restaurantsList').append('<li title="Description: ' + restaurant.snippet_text + '... Phone: ' + (restaurant.phone == null ? 'Not provided!' : restaurant.phone) + '"><a target="_blank" href="' + restaurant.mobile_url + '">' + restaurant.name + ' </a><strong class="result" title="Yelp rating / Yelp reviews">' + restaurant.rating + ' / ' + restaurant.review_count + '</strong></li>');
        });
    });
}

function dateToYMD(date) {
    var d = date.getDate();
    var m = date.getMonth() + 1;
    var y = date.getFullYear();
    return (m <= 9 ? '0' + m : m) + '/' + (d <= 9 ? '0' + d : d) + '/' +y;
}