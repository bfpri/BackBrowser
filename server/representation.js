exports.Page = Page;
exports.Domain = Domain;

var fs = require('fs');

function Page(url_string) {
    this.url = url_string;
    this.in_links = new Array();
    this.out_links = new Array();
}

Page.prototype.url = "";
Page.prototype.in_links = null;
Page.prototype.out_links = null;

Page.prototype.addOutLink = function(link_url) {
    for (var i = 0; i < this.out_links.length; i++) {
        if (this.out_links[i] == link_url) {
            // This link is already present, don't duplicate it
            return;
        }
    }
    
    // This link is not present, so add it
    this.out_links.push(link_url);
};

Page.prototype.addInLink = function(link_url) {
    for (var i = 0; i < this.in_links.length; i++) {
        if (this.in_links[i] == link_url) {
            // This link is already present, don't duplicate it
            return;
        }
    }
    
    // This link is not present, so add it
    this.in_links.push(link_url);
};

Page.prototype.toJSON = function() {
    var json = {};
    json["url"] = this.url;
    json["in_links"] = this.in_links;
    json["out_links"] = this.out_links;
    
    return json
};

Page.prototype.fromJSON = function(json) {
    this.url = json["url"];
    this.in_links = json["in_links"];
    this.out_links = json["out_links"];
};

function Domain(domain_string) {
    this.url = domain_string;
    this.pages = new Array();
}

Domain.prototype.url = "";
Domain.prototype.pages = null;

Domain.prototype.addPage = function(page) {
    for (var i = 0; i < this.pages.length; i++) {
        if (this.pages[i].url == page.url) {
            // This page is already present, don't duplicate it
            return;
        }
    }
    
    // This page is not present, so add it
    this.pages.push(page);
};

Domain.prototype.getPage = function(page_url) {
    for (var i = 0; i < this.pages.length; i++) {
        if (this.pages[i].url == page_url) {
            return this.pages[i];
        }
    }
    
    return null;
};

Domain.prototype.populateBackLinks = function() {
    for (var i = 0; i < this.pages.length; i++) {
        var page = this.pages[i];
        for (var j = 0; j < page.out_links.length; j++) {
            var ref_page = this.getPage(page.out_links[j]);
            if (ref_page == null) {
                this.log("Encountered link from " + page.url + " -> " + page.out_links[j] + " (unknown)");
            }
            else {
                ref_page.addInLink(page.url);
            }
        }
    }
    
    this.log("Back links have been populated for domain " + this.url);
};

Domain.prototype.toJSON = function() {
    var json = {}
    json["url"] = this.url;
    json["pages"] = new Array();
    for (var i = 0; i < this.pages.length; i++) {
        json["pages"].push(this.pages[i].toJSON());
    }
    
    return json;
};

Domain.prototype.fromJSON = function(json) {
    this.url = json["url"];
    this.pages = new Array();
    for (var i = 0; i < json["pages"].length; i++) {
        var page = new Page();
        page.fromJSON(json["pages"][i]);
        this.pages.push(page);
    }
};

Domain.prototype.dump = function(file, callback) {
    var self = this;
    fs.writeFile(file, JSON.stringify(this.toJSON(), null, 4), function(error) {
       if (error) {
           self.log("Error dumping domain " + self.url + ": " + error);
       }
       else {
           self.log("Finished dumping domain " + self.url + " to " + file);
       }
       
       if (callback) {
           callback();
       }
    });
};

Domain.prototype.log = function(message) {
    console.log("DomainRepresentation | " + message);
};