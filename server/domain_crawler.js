exports.DomainCrawler = DomainCrawler;

var Crawler = require('Crawler').Crawler;
var Url = require('url');
var Representation = require('./representation');

function DomainCrawler(domain_url) {
    this.domain = domain_url;
    this.representation = new Representation.Domain(domain_url);
    
    var self = this;
    
    this.crawler = new Crawler({
        "maxConnections" : 10,
        "headers" : { "User-Agent" : "BackBrowserBot" },
        "callback" : function(error, result, $) {
            self.processPage(error, result, $);
        },
        "onDrain" : function() {
            self.finishCallback();
        }
    });
}

DomainCrawler.prototype.domain = "";
DomainCrawler.prototype.encountered = new Array();
DomainCrawler.prototype.domain_representation = null;

DomainCrawler.prototype.processPage = function(error, result, $) {
    if (error) {
        this.log(JSON.serialize(error));
    }
    else {
        this.log("Crawled page: " + result.uri)
        
        var page = new Representation.Page(result.uri);
        
        if ($) {
            var self = this;
            $("a").each(function (index, link) {
                var linked_url = self.normalizeUrl(link.href);
                
                if (self.isSameDomain(linked_url)) {
                    page.addOutLink(linked_url);
                    
                    if (!self.isEncountered(linked_url)) {
                        self.log("    Crawling link: " + linked_url);
                        self.crawlPage(linked_url);
                    }
                }
            });
        }
        
        this.representation.addPage(page);
    }
};

DomainCrawler.prototype.start = function(finish_callback) {
    this.log("============================================================");
    this.log("Starting to crawl domain " + this.domain);
    this.log("============================================================");
    
    var self = this;
    this.finishCallback = function() {
        self.log("============================================================");
        self.log("Finished crawling domain " + self.domain);
        self.log("============================================================");
        
        this.representation.populateBackLinks();
        this.representation.last_crawled = new Date();
        
        this.representation.dump(Url.parse(self.domain).hostname + ".json", function() {
            if (finish_callback) {
                finish_callback();
            }
        });
    };
    
    this.crawlPage(this.domain);
};

DomainCrawler.prototype.crawlPage = function(url_string) {
    this.encountered.push(url_string);
    this.crawler.queue(url_string);
};

DomainCrawler.prototype.normalizeUrl = function(url_string) {
    var url = Url.parse(url_string);
    var normalized = url.protocol + "//" + url.host + url.path;
    return normalized;
};

DomainCrawler.prototype.isSameDomain = function(url_string) {
    var url = Url.parse(url_string);
    var url_domain = url.protocol + "//" + url.hostname;
    
    return url_domain == this.domain;
};

DomainCrawler.prototype.isEncountered = function(url_string) {
    if (this.encountered.indexOf(url_string) == -1) {
        return false;
    }
    else {
        return true;
    }
};

DomainCrawler.prototype.timeSinceLastCrawl = function() {
    return (new Date() - this.representation.last_crawled);
};

DomainCrawler.prototype.log = function(message) {
    console.log("DomainCrawler | " + message);
};