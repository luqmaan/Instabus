var favoritesHelper = {},
	listeners = [],
	lsKey = 'rappid:favorites',
	favorites = getFavorites();

function getFavorites() {
	var tempFavorites = [];
	if (localStorage) {
		tempFavorites = JSON.parse(localStorage.getItem(lsKey));
	}
	return tempFavorites || [];
}

function fireListeners() {
	var args = Array.prototype.slice.call(arguments);
	listeners.forEach(function(_listener) {
		_listener.apply(_listener, args);
	});
}

function sync() {
	if (localStorage) {
		try {
			localStorage.setItem(lsKey, JSON.stringify(favorites));
		} catch (e) {
			console.error(e);
			alert('We\'re sorry, your browser does not support this feature.');
		}
	}
}

favoritesHelper.get = function() {
	return favorites;
};

favoritesHelper.toggleFavorite = function(id) {
	if (favoritesHelper.isFavorite(id)) {
		favorites = favorites.filter(function(favorite) {
			return favorite !== id;
		});
	} else {
		favorites.push(id);
	}

	sync();
	fireListeners(favorites);

	return favoritesHelper.isFavorite(id);
};

favoritesHelper.isFavorite = function(id) {
	return favorites.indexOf(id) > -1;
};

favoritesHelper.subscribe = function(_listener) {
	listeners.push(_listener);
};

module.exports = favoritesHelper;