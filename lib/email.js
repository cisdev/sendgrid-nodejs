"use strict";

var FileHandler     = require('./file_handler');
var smtpapi_lib     = require('smtpapi');
var _               = require('lodash');
var request         = require('request');
var fs              = require('fs');

function Email(params) {
  params = params || {};

  this.to      = params.to      || [];
  this.from    = params.from    || '';
  this.smtpapi = params.smtpapi || new smtpapi_lib();
  this.subject = params.subject || '';
  this.text    = params.text    || '';
  this.html    = params.html    || '';
  this.bcc     = params.bcc     || [];
  this.cc      = params.cc      || [];
  this.replyto = params.replyto || '';
  this.date    = params.date    || '';
  this.headers = params.headers || {};

  if(params.toname !== null) {
    this.toname = params.toname;
  }
  if(params.fromname !== null) {
    this.fromname = params.fromname;
  }
  // auto handle calling the constructor for the file handler
  this.files = [];
  if (params.files) {
    params.files.forEach(function(file) {
      this.files.push(new FileHandler(file));
    }, this);
  }
}

Email.prototype.addHeader = function(object_literal_or_key, value) {
  if (typeof value === "undefined" || value === null) { 
    value = ""; 
  }

  if (_.isObject(object_literal_or_key)) {
    _.extend(this.headers, object_literal_or_key);
  } else {
    var object_to_add = {}
    object_to_add[object_literal_or_key] = value;
    _.extend(this.headers, object_to_add);
  }
};

Email.prototype.setHeaders = function(object_literal) {
  if (_.isObject(object_literal)) {
    this.headers = object_literal;
  }
};

Email.prototype.addTo = function(to) {
  this.smtpapi.addTo(to);
};

Email.prototype.setTos = function(tos) {
  this.smtpapi.setTos(tos);
};

Email.prototype.setFrom = function(from) {
  this.from = from;
};

Email.prototype.addCc = function(cc) {
  this.cc.push(cc);
};

Email.prototype.setCcs = function(cc) {
  this.cc = cc;
};

Email.prototype.setSubject = function(subject) {
  this.subject = subject;
};

Email.prototype.setText = function(text) {
  this.text = text;
};

Email.prototype.setHtml = function(html) {
  this.html = html;
};

Email.prototype.addSubstitution = function(key, val) {
  this.smtpapi.addSubstitution(key, val);
};

Email.prototype.setSubstitutions = function(substitutions) {
  this.smtpapi.setSubstitutions(substitutions);
};

Email.prototype.addUniqueArg = function (key, val) {
  this.smtpapi.addUniqueArg(key, val);
};

Email.prototype.setUniqueArgs = function(object_literal) {
  this.smtpapi.setUniqueArgs(object_literal);
};

Email.prototype.addCategory = function(val) {
  this.smtpapi.addCategory(val);
};

Email.prototype.setCategories = function(val) {
  this.smtpapi.setCategories(val);
};

Email.prototype.addSection = function(key, val) {
  this.smtpapi.addSection(key, val);
};

Email.prototype.setSections = function(object_literal) {
  this.smtpapi.setSections(object_literal);
};

Email.prototype.addFilter = function(filter, setting, val) {
  this.smtpapi.addFilter(filter, setting, val);
};

Email.prototype.setFilters = function(filters) {
  this.smtpapi.setFilters(filters);
};

Email.prototype.setASMGroupID = function(val) {
  this.smtpapi.setASMGroupID(val);
};

Email.prototype.addFile = function(file_object) {
  this.files.push(new FileHandler(file_object));
};

Email.prototype.setDate = function(date) {
  this.date = date;
};

Email.prototype.setSendAt = function(send_at) {
  this.smtpapi.setSendAt(send_at);
};

Email.prototype.setSendEachAt = function(send_each_at) {
  this.smtpapi.setSendEachAt(send_each_at);
};

Email.prototype.addSendEachAt = function(send_each_at) {
  this.smtpapi.addSendEachAt(send_each_at);
};

Email.prototype.toWebFormat = function() {
  var web  = {
    to          : this.to,
    from        : this.from,
    'x-smtpapi' : this.smtpapi.jsonString(),
    subject     : this.subject,
    text        : this.text,
    html        : this.html,
    headers     : JSON.stringify(this.headers)
  };

  if (this.bcc)         { web.bcc          = this.bcc; }
  if (this.cc)          { web.cc           = this.cc; }
  if (this.html)        { web.html         = this.html; }
  if (this.toname)      { web.toname       = this.toname; }
  if (this.fromname)    { web.fromname     = this.fromname; }
  if (this.replyto)     { web.replyto      = this.replyto; }
  if (this.date)        { web.date         = this.date; }
  if (this.smtpapi.to && this.smtpapi.to.length)  { web.to = ""; }

  this.updateMissingTo(web);

  if (this.files) {
    this.files.forEach(function(file) {

      if (file.url) {
        file.content  = request(file.url);
      } else if (file.path) {
        file.content  = fs.createReadStream(file.path);
      }

      web['files[' + file.filename + ']'] = {
        filename      : file.filename,
        content       : file.content || " ",
        contentType   : file.contentType,
        cid           : file.cid
      };
    });
  }

  return web;
};

Email.prototype._formatFilesForNodeMailer = function(files) {
  var self = this;
  if (files && files.length > 0) {
    files.forEach(function(file) {
      self._formatFileForNodeMailer(file);
    });
  }
};

Email.prototype._formatFileForNodeMailer = function(file) {
  if (file.filename) {
    file.fileName = file.filename;
  }
  if (file.path) {
    file.filePath = file.path;
  }
  if (file.url) {
    file.filePath = file.url;
  }
  if (file.content) {
    file.contents = file.content;
  }
  if (!file.filePath && !file.content && file.filename) {
    file.contents = " ";
  }
};

Email.prototype.updateMissingTo = function(data) {
  if (this.smtpapi.jsonObject().to && this.smtpapi.jsonObject().to.length > 0) {
    data.to = this.from;
  }
};

Email.prototype.hasFiles = function() {
  return this.files.length > 0;
};

// export the object as the only object in this module
module.exports = Email;
