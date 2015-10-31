var fs = require('fs');
var ko = require('knockout');

var infoHTML = fs.readFileSync(__dirname + '/../templates/info.html', 'utf8');

function InfoViewModel() {
    this.infoText = ko.observable('About');
    this.showTransitime = ko.observable(!!localStorage.getItem('showtransitime'));
    console.log('wef', !!localStorage.getItem('showtransitime'))

    this.showTransitime.subscribe(function(value) {
        console.log('Setting transitime to', !!value);
        if (!!value) {
            localStorage.setItem('showtransitime', 'hi');
        }
        else {
            localStorage.removeItem('showtransitime');
        }
    });

    window.addEventListener("hashchange", this.hashChange.bind(this));
    this.hashChange();
}

InfoViewModel.prototype.applyBindings = function() {
    var div = document.querySelector("#content-wrapper");
    var inner = div.querySelector('.inner');

    if (inner) {
        ko.cleanNode(inner);
        inner.remove();
    }
    div.innerHTML = infoHTML;
    inner = div.querySelector('.inner');
    ko.applyBindings(this, inner);
};

InfoViewModel.prototype.hashChange = function() {
    if (window.location.hash === '#/info') {
        this.applyBindings();
    }
};

InfoViewModel.prototype.toggleInfo = function() {
    if (window.location.hash === '#/info') {
        if (history.length > 2) {
            history.back();
        }
        else {
            window.location = '#';
        }
    }
    else {
        return true;
    }
};

InfoViewModel.prototype.reportProblem = function() {
    window.location.href = "mailto:ldawoodjee@gmail.com?subject=Instabus Issue&body=Issue:%0ADescription:%0ASteps To Reproduce:";
};

module.exports = InfoViewModel;
