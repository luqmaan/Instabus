var fs = require('fs');
var ko = require('knockout');

var infoHTML = fs.readFileSync(__dirname + '/../templates/info.html', 'utf8');

function InfoViewModel() {
    var self = this;
    console.log('new infoviewmodel')

    this.infoText = ko.observable('');
    this.infoShown = ko.observable(false);
    this.infoShown.subscribe(function(newValue) {
        if (newValue) {
            location = '#/info'
            self.infoText('Hide Info');
        } else {
            location = '#'
            self.infoText('Show Info');
        }

        self.applyBindings();
    });

    if (location.hash === '#/info') {
        this.infoShown(true);
        this.infoText('Hide Info');
    } else {
        this.infoShown(false);
        this.infoText('Show Info');
    }
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

InfoViewModel.prototype.toggleInfo = function() {
    if (this.infoVM.infoShown() === true) {
        this.infoVM.infoShown(false);
    } else {
        this.infoVM.infoShown(true);
    }
}

InfoViewModel.prototype.reportProblem = function() {
    window.location.href = "mailto:ldawoodjee@gmail.com?subject=MetroRappid Issue&body=Issue:%0ADescription:%0ASteps To Reproduce:";
    setTimeout(function() {
        window.location.href = "https://www.youtube.com/watch?v=ygr5AHufBN4";
    }, 3000);
};

module.exports = InfoViewModel;
