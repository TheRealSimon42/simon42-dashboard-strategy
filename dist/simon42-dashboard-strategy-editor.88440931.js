/*! For license information please see simon42-dashboard-strategy-editor.88440931.js.LICENSE.txt */
"use strict";(self.webpackChunksimon42_dashboard_strategy=self.webpackChunksimon42_dashboard_strategy||[]).push([[8],{580(e,t,i){var o=i(957);function n(e){return null==e}var r={isNothing:n,isObject:function(e){return"object"==typeof e&&null!==e},toArray:function(e){return Array.isArray(e)?e:n(e)?[]:[e]},repeat:function(e,t){var i,o="";for(i=0;i<t;i+=1)o+=e;return o},isNegativeZero:function(e){return 0===e&&Number.NEGATIVE_INFINITY===1/e},extend:function(e,t){var i,o,n,r;if(t)for(i=0,o=(r=Object.keys(t)).length;i<o;i+=1)e[n=r[i]]=t[n];return e}};function a(e,t){var i="",o=e.reason||"(unknown reason)";return e.mark?(e.mark.name&&(i+='in "'+e.mark.name+'" '),i+="("+(e.mark.line+1)+":"+(e.mark.column+1)+")",!t&&e.mark.snippet&&(i+="\n\n"+e.mark.snippet),o+" "+i):o}function s(e,t){Error.call(this),this.name="YAMLException",this.reason=e,this.mark=t,this.message=a(this,!1),Error.captureStackTrace?Error.captureStackTrace(this,this.constructor):this.stack=(new Error).stack||""}s.prototype=Object.create(Error.prototype),s.prototype.constructor=s,s.prototype.toString=function(e){return this.name+": "+a(this,e)};var c=s;function l(e,t,i,o,n){var r="",a="",s=Math.floor(n/2)-1;return o-t>s&&(t=o-s+(r=" ... ").length),i-o>s&&(i=o+s-(a=" ...").length),{str:r+e.slice(t,i).replace(/\t/g,"→")+a,pos:o-t+r.length}}function d(e,t){return r.repeat(" ",t-e.length)+e}var p=["kind","multi","resolve","construct","instanceOf","predicate","represent","representName","defaultStyle","styleAliases"],u=["scalar","sequence","mapping"],h=function(e,t){if(t=t||{},Object.keys(t).forEach(function(t){if(-1===p.indexOf(t))throw new c('Unknown option "'+t+'" is met in definition of "'+e+'" YAML type.')}),this.options=t,this.tag=e,this.kind=t.kind||null,this.resolve=t.resolve||function(){return!0},this.construct=t.construct||function(e){return e},this.instanceOf=t.instanceOf||null,this.predicate=t.predicate||null,this.represent=t.represent||null,this.representName=t.representName||null,this.defaultStyle=t.defaultStyle||null,this.multi=t.multi||!1,this.styleAliases=function(e){var t={};return null!==e&&Object.keys(e).forEach(function(i){e[i].forEach(function(e){t[String(e)]=i})}),t}(t.styleAliases||null),-1===u.indexOf(this.kind))throw new c('Unknown kind "'+this.kind+'" is specified for "'+e+'" YAML type.')};function g(e,t){var i=[];return e[t].forEach(function(e){var t=i.length;i.forEach(function(i,o){i.tag===e.tag&&i.kind===e.kind&&i.multi===e.multi&&(t=o)}),i[t]=e}),i}function _(e){return this.extend(e)}_.prototype.extend=function(e){var t=[],i=[];if(e instanceof h)i.push(e);else if(Array.isArray(e))i=i.concat(e);else{if(!e||!Array.isArray(e.implicit)&&!Array.isArray(e.explicit))throw new c("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");e.implicit&&(t=t.concat(e.implicit)),e.explicit&&(i=i.concat(e.explicit))}t.forEach(function(e){if(!(e instanceof h))throw new c("Specified list of YAML types (or a single Type object) contains a non-Type object.");if(e.loadKind&&"scalar"!==e.loadKind)throw new c("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");if(e.multi)throw new c("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.")}),i.forEach(function(e){if(!(e instanceof h))throw new c("Specified list of YAML types (or a single Type object) contains a non-Type object.")});var o=Object.create(_.prototype);return o.implicit=(this.implicit||[]).concat(t),o.explicit=(this.explicit||[]).concat(i),o.compiledImplicit=g(o,"implicit"),o.compiledExplicit=g(o,"explicit"),o.compiledTypeMap=function(){var e,t,i={scalar:{},sequence:{},mapping:{},fallback:{},multi:{scalar:[],sequence:[],mapping:[],fallback:[]}};function o(e){e.multi?(i.multi[e.kind].push(e),i.multi.fallback.push(e)):i[e.kind][e.tag]=i.fallback[e.tag]=e}for(e=0,t=arguments.length;e<t;e+=1)arguments[e].forEach(o);return i}(o.compiledImplicit,o.compiledExplicit),o};var f=_,m=new h("tag:yaml.org,2002:str",{kind:"scalar",construct:function(e){return null!==e?e:""}}),v=new h("tag:yaml.org,2002:seq",{kind:"sequence",construct:function(e){return null!==e?e:[]}}),y=new h("tag:yaml.org,2002:map",{kind:"mapping",construct:function(e){return null!==e?e:{}}}),b=new f({explicit:[m,v,y]}),x=new h("tag:yaml.org,2002:null",{kind:"scalar",resolve:function(e){if(null===e)return!0;var t=e.length;return 1===t&&"~"===e||4===t&&("null"===e||"Null"===e||"NULL"===e)},construct:function(){return null},predicate:function(e){return null===e},represent:{canonical:function(){return"~"},lowercase:function(){return"null"},uppercase:function(){return"NULL"},camelcase:function(){return"Null"},empty:function(){return""}},defaultStyle:"lowercase"}),w=new h("tag:yaml.org,2002:bool",{kind:"scalar",resolve:function(e){if(null===e)return!1;var t=e.length;return 4===t&&("true"===e||"True"===e||"TRUE"===e)||5===t&&("false"===e||"False"===e||"FALSE"===e)},construct:function(e){return"true"===e||"True"===e||"TRUE"===e},predicate:function(e){return"[object Boolean]"===Object.prototype.toString.call(e)},represent:{lowercase:function(e){return e?"true":"false"},uppercase:function(e){return e?"TRUE":"FALSE"},camelcase:function(e){return e?"True":"False"}},defaultStyle:"lowercase"});function k(e){return 48<=e&&e<=57||65<=e&&e<=70||97<=e&&e<=102}function C(e){return 48<=e&&e<=55}function $(e){return 48<=e&&e<=57}var A=new h("tag:yaml.org,2002:int",{kind:"scalar",resolve:function(e){if(null===e)return!1;var t,i=e.length,o=0,n=!1;if(!i)return!1;if("-"!==(t=e[o])&&"+"!==t||(t=e[++o]),"0"===t){if(o+1===i)return!0;if("b"===(t=e[++o])){for(o++;o<i;o++)if("_"!==(t=e[o])){if("0"!==t&&"1"!==t)return!1;n=!0}return n&&"_"!==t}if("x"===t){for(o++;o<i;o++)if("_"!==(t=e[o])){if(!k(e.charCodeAt(o)))return!1;n=!0}return n&&"_"!==t}if("o"===t){for(o++;o<i;o++)if("_"!==(t=e[o])){if(!C(e.charCodeAt(o)))return!1;n=!0}return n&&"_"!==t}}if("_"===t)return!1;for(;o<i;o++)if("_"!==(t=e[o])){if(!$(e.charCodeAt(o)))return!1;n=!0}return!(!n||"_"===t)},construct:function(e){var t,i=e,o=1;if(-1!==i.indexOf("_")&&(i=i.replace(/_/g,"")),"-"!==(t=i[0])&&"+"!==t||("-"===t&&(o=-1),t=(i=i.slice(1))[0]),"0"===i)return 0;if("0"===t){if("b"===i[1])return o*parseInt(i.slice(2),2);if("x"===i[1])return o*parseInt(i.slice(2),16);if("o"===i[1])return o*parseInt(i.slice(2),8)}return o*parseInt(i,10)},predicate:function(e){return"[object Number]"===Object.prototype.toString.call(e)&&e%1==0&&!r.isNegativeZero(e)},represent:{binary:function(e){return e>=0?"0b"+e.toString(2):"-0b"+e.toString(2).slice(1)},octal:function(e){return e>=0?"0o"+e.toString(8):"-0o"+e.toString(8).slice(1)},decimal:function(e){return e.toString(10)},hexadecimal:function(e){return e>=0?"0x"+e.toString(16).toUpperCase():"-0x"+e.toString(16).toUpperCase().slice(1)}},defaultStyle:"decimal",styleAliases:{binary:[2,"bin"],octal:[8,"oct"],decimal:[10,"dec"],hexadecimal:[16,"hex"]}}),z=new RegExp("^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"),S=/^[-+]?[0-9]+e/,O=new h("tag:yaml.org,2002:float",{kind:"scalar",resolve:function(e){return null!==e&&!(!z.test(e)||"_"===e[e.length-1])},construct:function(e){var t,i;return i="-"===(t=e.replace(/_/g,"").toLowerCase())[0]?-1:1,"+-".indexOf(t[0])>=0&&(t=t.slice(1)),".inf"===t?1===i?Number.POSITIVE_INFINITY:Number.NEGATIVE_INFINITY:".nan"===t?NaN:i*parseFloat(t,10)},predicate:function(e){return"[object Number]"===Object.prototype.toString.call(e)&&(e%1!=0||r.isNegativeZero(e))},represent:function(e,t){var i;if(isNaN(e))switch(t){case"lowercase":return".nan";case"uppercase":return".NAN";case"camelcase":return".NaN"}else if(Number.POSITIVE_INFINITY===e)switch(t){case"lowercase":return".inf";case"uppercase":return".INF";case"camelcase":return".Inf"}else if(Number.NEGATIVE_INFINITY===e)switch(t){case"lowercase":return"-.inf";case"uppercase":return"-.INF";case"camelcase":return"-.Inf"}else if(r.isNegativeZero(e))return"-0.0";return i=e.toString(10),S.test(i)?i.replace("e",".e"):i},defaultStyle:"lowercase"}),E=b.extend({implicit:[x,w,A,O]}),j=E,I=new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"),F=new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"),q=new h("tag:yaml.org,2002:timestamp",{kind:"scalar",resolve:function(e){return null!==e&&(null!==I.exec(e)||null!==F.exec(e))},construct:function(e){var t,i,o,n,r,a,s,c,l=0,d=null;if(null===(t=I.exec(e))&&(t=F.exec(e)),null===t)throw new Error("Date resolve error");if(i=+t[1],o=+t[2]-1,n=+t[3],!t[4])return new Date(Date.UTC(i,o,n));if(r=+t[4],a=+t[5],s=+t[6],t[7]){for(l=t[7].slice(0,3);l.length<3;)l+="0";l=+l}return t[9]&&(d=6e4*(60*+t[10]+ +(t[11]||0)),"-"===t[9]&&(d=-d)),c=new Date(Date.UTC(i,o,n,r,a,s,l)),d&&c.setTime(c.getTime()-d),c},instanceOf:Date,represent:function(e){return e.toISOString()}}),T=new h("tag:yaml.org,2002:merge",{kind:"scalar",resolve:function(e){return"<<"===e||null===e}}),N="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r",L=new h("tag:yaml.org,2002:binary",{kind:"scalar",resolve:function(e){if(null===e)return!1;var t,i,o=0,n=e.length,r=N;for(i=0;i<n;i++)if(!((t=r.indexOf(e.charAt(i)))>64)){if(t<0)return!1;o+=6}return o%8==0},construct:function(e){var t,i,o=e.replace(/[\r\n=]/g,""),n=o.length,r=N,a=0,s=[];for(t=0;t<n;t++)t%4==0&&t&&(s.push(a>>16&255),s.push(a>>8&255),s.push(255&a)),a=a<<6|r.indexOf(o.charAt(t));return 0==(i=n%4*6)?(s.push(a>>16&255),s.push(a>>8&255),s.push(255&a)):18===i?(s.push(a>>10&255),s.push(a>>2&255)):12===i&&s.push(a>>4&255),new Uint8Array(s)},predicate:function(e){return"[object Uint8Array]"===Object.prototype.toString.call(e)},represent:function(e){var t,i,o="",n=0,r=e.length,a=N;for(t=0;t<r;t++)t%3==0&&t&&(o+=a[n>>18&63],o+=a[n>>12&63],o+=a[n>>6&63],o+=a[63&n]),n=(n<<8)+e[t];return 0==(i=r%3)?(o+=a[n>>18&63],o+=a[n>>12&63],o+=a[n>>6&63],o+=a[63&n]):2===i?(o+=a[n>>10&63],o+=a[n>>4&63],o+=a[n<<2&63],o+=a[64]):1===i&&(o+=a[n>>2&63],o+=a[n<<4&63],o+=a[64],o+=a[64]),o}}),M=Object.prototype.hasOwnProperty,D=Object.prototype.toString,V=new h("tag:yaml.org,2002:omap",{kind:"sequence",resolve:function(e){if(null===e)return!0;var t,i,o,n,r,a=[],s=e;for(t=0,i=s.length;t<i;t+=1){if(o=s[t],r=!1,"[object Object]"!==D.call(o))return!1;for(n in o)if(M.call(o,n)){if(r)return!1;r=!0}if(!r)return!1;if(-1!==a.indexOf(n))return!1;a.push(n)}return!0},construct:function(e){return null!==e?e:[]}}),Y=Object.prototype.toString,B=new h("tag:yaml.org,2002:pairs",{kind:"sequence",resolve:function(e){if(null===e)return!0;var t,i,o,n,r,a=e;for(r=new Array(a.length),t=0,i=a.length;t<i;t+=1){if(o=a[t],"[object Object]"!==Y.call(o))return!1;if(1!==(n=Object.keys(o)).length)return!1;r[t]=[n[0],o[n[0]]]}return!0},construct:function(e){if(null===e)return[];var t,i,o,n,r,a=e;for(r=new Array(a.length),t=0,i=a.length;t<i;t+=1)o=a[t],n=Object.keys(o),r[t]=[n[0],o[n[0]]];return r}}),U=Object.prototype.hasOwnProperty,R=new h("tag:yaml.org,2002:set",{kind:"mapping",resolve:function(e){if(null===e)return!0;var t,i=e;for(t in i)if(U.call(i,t)&&null!==i[t])return!1;return!0},construct:function(e){return null!==e?e:{}}}),P=j.extend({implicit:[q,T],explicit:[L,V,B,R]}),G=Object.prototype.hasOwnProperty,H=/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,W=/[\x85\u2028\u2029]/,K=/[,\[\]\{\}]/,Z=/^(?:!|!!|![a-z\-]+!)$/i,Q=/^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;function J(e){return Object.prototype.toString.call(e)}function X(e){return 10===e||13===e}function ee(e){return 9===e||32===e}function te(e){return 9===e||32===e||10===e||13===e}function ie(e){return 44===e||91===e||93===e||123===e||125===e}function oe(e){var t;return 48<=e&&e<=57?e-48:97<=(t=32|e)&&t<=102?t-97+10:-1}function ne(e){return 120===e?2:117===e?4:85===e?8:0}function re(e){return 48<=e&&e<=57?e-48:-1}function ae(e){return 48===e?"\0":97===e?"":98===e?"\b":116===e||9===e?"\t":110===e?"\n":118===e?"\v":102===e?"\f":114===e?"\r":101===e?"":32===e?" ":34===e?'"':47===e?"/":92===e?"\\":78===e?"":95===e?" ":76===e?"\u2028":80===e?"\u2029":""}function se(e){return e<=65535?String.fromCharCode(e):String.fromCharCode(55296+(e-65536>>10),56320+(e-65536&1023))}function ce(e,t,i){"__proto__"===t?Object.defineProperty(e,t,{configurable:!0,enumerable:!0,writable:!0,value:i}):e[t]=i}for(var le=new Array(256),de=new Array(256),pe=0;pe<256;pe++)le[pe]=ae(pe)?1:0,de[pe]=ae(pe);function ue(e,t){this.input=e,this.filename=t.filename||null,this.schema=t.schema||P,this.onWarning=t.onWarning||null,this.legacy=t.legacy||!1,this.json=t.json||!1,this.listener=t.listener||null,this.implicitTypes=this.schema.compiledImplicit,this.typeMap=this.schema.compiledTypeMap,this.length=e.length,this.position=0,this.line=0,this.lineStart=0,this.lineIndent=0,this.firstTabInLine=-1,this.documents=[]}function he(e,t){var i={name:e.filename,buffer:e.input.slice(0,-1),position:e.position,line:e.line,column:e.position-e.lineStart};return i.snippet=function(e,t){if(t=Object.create(t||null),!e.buffer)return null;t.maxLength||(t.maxLength=79),"number"!=typeof t.indent&&(t.indent=1),"number"!=typeof t.linesBefore&&(t.linesBefore=3),"number"!=typeof t.linesAfter&&(t.linesAfter=2);for(var i,o=/\r?\n|\r|\0/g,n=[0],a=[],s=-1;i=o.exec(e.buffer);)a.push(i.index),n.push(i.index+i[0].length),e.position<=i.index&&s<0&&(s=n.length-2);s<0&&(s=n.length-1);var c,p,u="",h=Math.min(e.line+t.linesAfter,a.length).toString().length,g=t.maxLength-(t.indent+h+3);for(c=1;c<=t.linesBefore&&!(s-c<0);c++)p=l(e.buffer,n[s-c],a[s-c],e.position-(n[s]-n[s-c]),g),u=r.repeat(" ",t.indent)+d((e.line-c+1).toString(),h)+" | "+p.str+"\n"+u;for(p=l(e.buffer,n[s],a[s],e.position,g),u+=r.repeat(" ",t.indent)+d((e.line+1).toString(),h)+" | "+p.str+"\n",u+=r.repeat("-",t.indent+h+3+p.pos)+"^\n",c=1;c<=t.linesAfter&&!(s+c>=a.length);c++)p=l(e.buffer,n[s+c],a[s+c],e.position-(n[s]-n[s+c]),g),u+=r.repeat(" ",t.indent)+d((e.line+c+1).toString(),h)+" | "+p.str+"\n";return u.replace(/\n$/,"")}(i),new c(t,i)}function ge(e,t){throw he(e,t)}function _e(e,t){e.onWarning&&e.onWarning.call(null,he(e,t))}var fe={YAML:function(e,t,i){var o,n,r;null!==e.version&&ge(e,"duplication of %YAML directive"),1!==i.length&&ge(e,"YAML directive accepts exactly one argument"),null===(o=/^([0-9]+)\.([0-9]+)$/.exec(i[0]))&&ge(e,"ill-formed argument of the YAML directive"),n=parseInt(o[1],10),r=parseInt(o[2],10),1!==n&&ge(e,"unacceptable YAML version of the document"),e.version=i[0],e.checkLineBreaks=r<2,1!==r&&2!==r&&_e(e,"unsupported YAML version of the document")},TAG:function(e,t,i){var o,n;2!==i.length&&ge(e,"TAG directive accepts exactly two arguments"),o=i[0],n=i[1],Z.test(o)||ge(e,"ill-formed tag handle (first argument) of the TAG directive"),G.call(e.tagMap,o)&&ge(e,'there is a previously declared suffix for "'+o+'" tag handle'),Q.test(n)||ge(e,"ill-formed tag prefix (second argument) of the TAG directive");try{n=decodeURIComponent(n)}catch(t){ge(e,"tag prefix is malformed: "+n)}e.tagMap[o]=n}};function me(e,t,i,o){var n,r,a,s;if(t<i){if(s=e.input.slice(t,i),o)for(n=0,r=s.length;n<r;n+=1)9===(a=s.charCodeAt(n))||32<=a&&a<=1114111||ge(e,"expected valid JSON character");else H.test(s)&&ge(e,"the stream contains non-printable characters");e.result+=s}}function ve(e,t,i,o){var n,a,s,c;for(r.isObject(i)||ge(e,"cannot merge mappings; the provided source object is unacceptable"),s=0,c=(n=Object.keys(i)).length;s<c;s+=1)a=n[s],G.call(t,a)||(ce(t,a,i[a]),o[a]=!0)}function ye(e,t,i,o,n,r,a,s,c){var l,d;if(Array.isArray(n))for(l=0,d=(n=Array.prototype.slice.call(n)).length;l<d;l+=1)Array.isArray(n[l])&&ge(e,"nested arrays are not supported inside keys"),"object"==typeof n&&"[object Object]"===J(n[l])&&(n[l]="[object Object]");if("object"==typeof n&&"[object Object]"===J(n)&&(n="[object Object]"),n=String(n),null===t&&(t={}),"tag:yaml.org,2002:merge"===o)if(Array.isArray(r))for(l=0,d=r.length;l<d;l+=1)ve(e,t,r[l],i);else ve(e,t,r,i);else e.json||G.call(i,n)||!G.call(t,n)||(e.line=a||e.line,e.lineStart=s||e.lineStart,e.position=c||e.position,ge(e,"duplicated mapping key")),ce(t,n,r),delete i[n];return t}function be(e){var t;10===(t=e.input.charCodeAt(e.position))?e.position++:13===t?(e.position++,10===e.input.charCodeAt(e.position)&&e.position++):ge(e,"a line break is expected"),e.line+=1,e.lineStart=e.position,e.firstTabInLine=-1}function xe(e,t,i){for(var o=0,n=e.input.charCodeAt(e.position);0!==n;){for(;ee(n);)9===n&&-1===e.firstTabInLine&&(e.firstTabInLine=e.position),n=e.input.charCodeAt(++e.position);if(t&&35===n)do{n=e.input.charCodeAt(++e.position)}while(10!==n&&13!==n&&0!==n);if(!X(n))break;for(be(e),n=e.input.charCodeAt(e.position),o++,e.lineIndent=0;32===n;)e.lineIndent++,n=e.input.charCodeAt(++e.position)}return-1!==i&&0!==o&&e.lineIndent<i&&_e(e,"deficient indentation"),o}function we(e){var t,i=e.position;return!(45!==(t=e.input.charCodeAt(i))&&46!==t||t!==e.input.charCodeAt(i+1)||t!==e.input.charCodeAt(i+2)||(i+=3,0!==(t=e.input.charCodeAt(i))&&!te(t)))}function ke(e,t){1===t?e.result+=" ":t>1&&(e.result+=r.repeat("\n",t-1))}function Ce(e,t){var i,o,n=e.tag,r=e.anchor,a=[],s=!1;if(-1!==e.firstTabInLine)return!1;for(null!==e.anchor&&(e.anchorMap[e.anchor]=a),o=e.input.charCodeAt(e.position);0!==o&&(-1!==e.firstTabInLine&&(e.position=e.firstTabInLine,ge(e,"tab characters must not be used in indentation")),45===o)&&te(e.input.charCodeAt(e.position+1));)if(s=!0,e.position++,xe(e,!0,-1)&&e.lineIndent<=t)a.push(null),o=e.input.charCodeAt(e.position);else if(i=e.line,ze(e,t,3,!1,!0),a.push(e.result),xe(e,!0,-1),o=e.input.charCodeAt(e.position),(e.line===i||e.lineIndent>t)&&0!==o)ge(e,"bad indentation of a sequence entry");else if(e.lineIndent<t)break;return!!s&&(e.tag=n,e.anchor=r,e.kind="sequence",e.result=a,!0)}function $e(e){var t,i,o,n,r=!1,a=!1;if(33!==(n=e.input.charCodeAt(e.position)))return!1;if(null!==e.tag&&ge(e,"duplication of a tag property"),60===(n=e.input.charCodeAt(++e.position))?(r=!0,n=e.input.charCodeAt(++e.position)):33===n?(a=!0,i="!!",n=e.input.charCodeAt(++e.position)):i="!",t=e.position,r){do{n=e.input.charCodeAt(++e.position)}while(0!==n&&62!==n);e.position<e.length?(o=e.input.slice(t,e.position),n=e.input.charCodeAt(++e.position)):ge(e,"unexpected end of the stream within a verbatim tag")}else{for(;0!==n&&!te(n);)33===n&&(a?ge(e,"tag suffix cannot contain exclamation marks"):(i=e.input.slice(t-1,e.position+1),Z.test(i)||ge(e,"named tag handle cannot contain such characters"),a=!0,t=e.position+1)),n=e.input.charCodeAt(++e.position);o=e.input.slice(t,e.position),K.test(o)&&ge(e,"tag suffix cannot contain flow indicator characters")}o&&!Q.test(o)&&ge(e,"tag name cannot contain such characters: "+o);try{o=decodeURIComponent(o)}catch(t){ge(e,"tag name is malformed: "+o)}return r?e.tag=o:G.call(e.tagMap,i)?e.tag=e.tagMap[i]+o:"!"===i?e.tag="!"+o:"!!"===i?e.tag="tag:yaml.org,2002:"+o:ge(e,'undeclared tag handle "'+i+'"'),!0}function Ae(e){var t,i;if(38!==(i=e.input.charCodeAt(e.position)))return!1;for(null!==e.anchor&&ge(e,"duplication of an anchor property"),i=e.input.charCodeAt(++e.position),t=e.position;0!==i&&!te(i)&&!ie(i);)i=e.input.charCodeAt(++e.position);return e.position===t&&ge(e,"name of an anchor node must contain at least one character"),e.anchor=e.input.slice(t,e.position),!0}function ze(e,t,i,o,n){var a,s,c,l,d,p,u,h,g,_=1,f=!1,m=!1;if(null!==e.listener&&e.listener("open",e),e.tag=null,e.anchor=null,e.kind=null,e.result=null,a=s=c=4===i||3===i,o&&xe(e,!0,-1)&&(f=!0,e.lineIndent>t?_=1:e.lineIndent===t?_=0:e.lineIndent<t&&(_=-1)),1===_)for(;$e(e)||Ae(e);)xe(e,!0,-1)?(f=!0,c=a,e.lineIndent>t?_=1:e.lineIndent===t?_=0:e.lineIndent<t&&(_=-1)):c=!1;if(c&&(c=f||n),1!==_&&4!==i||(h=1===i||2===i?t:t+1,g=e.position-e.lineStart,1===_?c&&(Ce(e,g)||function(e,t,i){var o,n,r,a,s,c,l,d=e.tag,p=e.anchor,u={},h=Object.create(null),g=null,_=null,f=null,m=!1,v=!1;if(-1!==e.firstTabInLine)return!1;for(null!==e.anchor&&(e.anchorMap[e.anchor]=u),l=e.input.charCodeAt(e.position);0!==l;){if(m||-1===e.firstTabInLine||(e.position=e.firstTabInLine,ge(e,"tab characters must not be used in indentation")),o=e.input.charCodeAt(e.position+1),r=e.line,63!==l&&58!==l||!te(o)){if(a=e.line,s=e.lineStart,c=e.position,!ze(e,i,2,!1,!0))break;if(e.line===r){for(l=e.input.charCodeAt(e.position);ee(l);)l=e.input.charCodeAt(++e.position);if(58===l)te(l=e.input.charCodeAt(++e.position))||ge(e,"a whitespace character is expected after the key-value separator within a block mapping"),m&&(ye(e,u,h,g,_,null,a,s,c),g=_=f=null),v=!0,m=!1,n=!1,g=e.tag,_=e.result;else{if(!v)return e.tag=d,e.anchor=p,!0;ge(e,"can not read an implicit mapping pair; a colon is missed")}}else{if(!v)return e.tag=d,e.anchor=p,!0;ge(e,"can not read a block mapping entry; a multiline key may not be an implicit key")}}else 63===l?(m&&(ye(e,u,h,g,_,null,a,s,c),g=_=f=null),v=!0,m=!0,n=!0):m?(m=!1,n=!0):ge(e,"incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"),e.position+=1,l=o;if((e.line===r||e.lineIndent>t)&&(m&&(a=e.line,s=e.lineStart,c=e.position),ze(e,t,4,!0,n)&&(m?_=e.result:f=e.result),m||(ye(e,u,h,g,_,f,a,s,c),g=_=f=null),xe(e,!0,-1),l=e.input.charCodeAt(e.position)),(e.line===r||e.lineIndent>t)&&0!==l)ge(e,"bad indentation of a mapping entry");else if(e.lineIndent<t)break}return m&&ye(e,u,h,g,_,null,a,s,c),v&&(e.tag=d,e.anchor=p,e.kind="mapping",e.result=u),v}(e,g,h))||function(e,t){var i,o,n,r,a,s,c,l,d,p,u,h,g=!0,_=e.tag,f=e.anchor,m=Object.create(null);if(91===(h=e.input.charCodeAt(e.position)))a=93,l=!1,r=[];else{if(123!==h)return!1;a=125,l=!0,r={}}for(null!==e.anchor&&(e.anchorMap[e.anchor]=r),h=e.input.charCodeAt(++e.position);0!==h;){if(xe(e,!0,t),(h=e.input.charCodeAt(e.position))===a)return e.position++,e.tag=_,e.anchor=f,e.kind=l?"mapping":"sequence",e.result=r,!0;g?44===h&&ge(e,"expected the node content, but found ','"):ge(e,"missed comma between flow collection entries"),u=null,s=c=!1,63===h&&te(e.input.charCodeAt(e.position+1))&&(s=c=!0,e.position++,xe(e,!0,t)),i=e.line,o=e.lineStart,n=e.position,ze(e,t,1,!1,!0),p=e.tag,d=e.result,xe(e,!0,t),h=e.input.charCodeAt(e.position),!c&&e.line!==i||58!==h||(s=!0,h=e.input.charCodeAt(++e.position),xe(e,!0,t),ze(e,t,1,!1,!0),u=e.result),l?ye(e,r,m,p,d,u,i,o,n):s?r.push(ye(e,null,m,p,d,u,i,o,n)):r.push(d),xe(e,!0,t),44===(h=e.input.charCodeAt(e.position))?(g=!0,h=e.input.charCodeAt(++e.position)):g=!1}ge(e,"unexpected end of the stream within a flow collection")}(e,h)?m=!0:(s&&function(e,t){var i,o,n,a,s=1,c=!1,l=!1,d=t,p=0,u=!1;if(124===(a=e.input.charCodeAt(e.position)))o=!1;else{if(62!==a)return!1;o=!0}for(e.kind="scalar",e.result="";0!==a;)if(43===(a=e.input.charCodeAt(++e.position))||45===a)1===s?s=43===a?3:2:ge(e,"repeat of a chomping mode identifier");else{if(!((n=re(a))>=0))break;0===n?ge(e,"bad explicit indentation width of a block scalar; it cannot be less than one"):l?ge(e,"repeat of an indentation width identifier"):(d=t+n-1,l=!0)}if(ee(a)){do{a=e.input.charCodeAt(++e.position)}while(ee(a));if(35===a)do{a=e.input.charCodeAt(++e.position)}while(!X(a)&&0!==a)}for(;0!==a;){for(be(e),e.lineIndent=0,a=e.input.charCodeAt(e.position);(!l||e.lineIndent<d)&&32===a;)e.lineIndent++,a=e.input.charCodeAt(++e.position);if(!l&&e.lineIndent>d&&(d=e.lineIndent),X(a))p++;else{if(e.lineIndent<d){3===s?e.result+=r.repeat("\n",c?1+p:p):1===s&&c&&(e.result+="\n");break}for(o?ee(a)?(u=!0,e.result+=r.repeat("\n",c?1+p:p)):u?(u=!1,e.result+=r.repeat("\n",p+1)):0===p?c&&(e.result+=" "):e.result+=r.repeat("\n",p):e.result+=r.repeat("\n",c?1+p:p),c=!0,l=!0,p=0,i=e.position;!X(a)&&0!==a;)a=e.input.charCodeAt(++e.position);me(e,i,e.position,!1)}}return!0}(e,h)||function(e,t){var i,o,n;if(39!==(i=e.input.charCodeAt(e.position)))return!1;for(e.kind="scalar",e.result="",e.position++,o=n=e.position;0!==(i=e.input.charCodeAt(e.position));)if(39===i){if(me(e,o,e.position,!0),39!==(i=e.input.charCodeAt(++e.position)))return!0;o=e.position,e.position++,n=e.position}else X(i)?(me(e,o,n,!0),ke(e,xe(e,!1,t)),o=n=e.position):e.position===e.lineStart&&we(e)?ge(e,"unexpected end of the document within a single quoted scalar"):(e.position++,n=e.position);ge(e,"unexpected end of the stream within a single quoted scalar")}(e,h)||function(e,t){var i,o,n,r,a,s;if(34!==(s=e.input.charCodeAt(e.position)))return!1;for(e.kind="scalar",e.result="",e.position++,i=o=e.position;0!==(s=e.input.charCodeAt(e.position));){if(34===s)return me(e,i,e.position,!0),e.position++,!0;if(92===s){if(me(e,i,e.position,!0),X(s=e.input.charCodeAt(++e.position)))xe(e,!1,t);else if(s<256&&le[s])e.result+=de[s],e.position++;else if((a=ne(s))>0){for(n=a,r=0;n>0;n--)(a=oe(s=e.input.charCodeAt(++e.position)))>=0?r=(r<<4)+a:ge(e,"expected hexadecimal character");e.result+=se(r),e.position++}else ge(e,"unknown escape sequence");i=o=e.position}else X(s)?(me(e,i,o,!0),ke(e,xe(e,!1,t)),i=o=e.position):e.position===e.lineStart&&we(e)?ge(e,"unexpected end of the document within a double quoted scalar"):(e.position++,o=e.position)}ge(e,"unexpected end of the stream within a double quoted scalar")}(e,h)?m=!0:function(e){var t,i,o;if(42!==(o=e.input.charCodeAt(e.position)))return!1;for(o=e.input.charCodeAt(++e.position),t=e.position;0!==o&&!te(o)&&!ie(o);)o=e.input.charCodeAt(++e.position);return e.position===t&&ge(e,"name of an alias node must contain at least one character"),i=e.input.slice(t,e.position),G.call(e.anchorMap,i)||ge(e,'unidentified alias "'+i+'"'),e.result=e.anchorMap[i],xe(e,!0,-1),!0}(e)?(m=!0,null===e.tag&&null===e.anchor||ge(e,"alias node should not have any properties")):function(e,t,i){var o,n,r,a,s,c,l,d,p=e.kind,u=e.result;if(te(d=e.input.charCodeAt(e.position))||ie(d)||35===d||38===d||42===d||33===d||124===d||62===d||39===d||34===d||37===d||64===d||96===d)return!1;if((63===d||45===d)&&(te(o=e.input.charCodeAt(e.position+1))||i&&ie(o)))return!1;for(e.kind="scalar",e.result="",n=r=e.position,a=!1;0!==d;){if(58===d){if(te(o=e.input.charCodeAt(e.position+1))||i&&ie(o))break}else if(35===d){if(te(e.input.charCodeAt(e.position-1)))break}else{if(e.position===e.lineStart&&we(e)||i&&ie(d))break;if(X(d)){if(s=e.line,c=e.lineStart,l=e.lineIndent,xe(e,!1,-1),e.lineIndent>=t){a=!0,d=e.input.charCodeAt(e.position);continue}e.position=r,e.line=s,e.lineStart=c,e.lineIndent=l;break}}a&&(me(e,n,r,!1),ke(e,e.line-s),n=r=e.position,a=!1),ee(d)||(r=e.position+1),d=e.input.charCodeAt(++e.position)}return me(e,n,r,!1),!!e.result||(e.kind=p,e.result=u,!1)}(e,h,1===i)&&(m=!0,null===e.tag&&(e.tag="?")),null!==e.anchor&&(e.anchorMap[e.anchor]=e.result)):0===_&&(m=c&&Ce(e,g))),null===e.tag)null!==e.anchor&&(e.anchorMap[e.anchor]=e.result);else if("?"===e.tag){for(null!==e.result&&"scalar"!==e.kind&&ge(e,'unacceptable node kind for !<?> tag; it should be "scalar", not "'+e.kind+'"'),l=0,d=e.implicitTypes.length;l<d;l+=1)if((u=e.implicitTypes[l]).resolve(e.result)){e.result=u.construct(e.result),e.tag=u.tag,null!==e.anchor&&(e.anchorMap[e.anchor]=e.result);break}}else if("!"!==e.tag){if(G.call(e.typeMap[e.kind||"fallback"],e.tag))u=e.typeMap[e.kind||"fallback"][e.tag];else for(u=null,l=0,d=(p=e.typeMap.multi[e.kind||"fallback"]).length;l<d;l+=1)if(e.tag.slice(0,p[l].tag.length)===p[l].tag){u=p[l];break}u||ge(e,"unknown tag !<"+e.tag+">"),null!==e.result&&u.kind!==e.kind&&ge(e,"unacceptable node kind for !<"+e.tag+'> tag; it should be "'+u.kind+'", not "'+e.kind+'"'),u.resolve(e.result,e.tag)?(e.result=u.construct(e.result,e.tag),null!==e.anchor&&(e.anchorMap[e.anchor]=e.result)):ge(e,"cannot resolve a node with !<"+e.tag+"> explicit tag")}return null!==e.listener&&e.listener("close",e),null!==e.tag||null!==e.anchor||m}function Se(e){var t,i,o,n,r=e.position,a=!1;for(e.version=null,e.checkLineBreaks=e.legacy,e.tagMap=Object.create(null),e.anchorMap=Object.create(null);0!==(n=e.input.charCodeAt(e.position))&&(xe(e,!0,-1),n=e.input.charCodeAt(e.position),!(e.lineIndent>0||37!==n));){for(a=!0,n=e.input.charCodeAt(++e.position),t=e.position;0!==n&&!te(n);)n=e.input.charCodeAt(++e.position);for(o=[],(i=e.input.slice(t,e.position)).length<1&&ge(e,"directive name must not be less than one character in length");0!==n;){for(;ee(n);)n=e.input.charCodeAt(++e.position);if(35===n){do{n=e.input.charCodeAt(++e.position)}while(0!==n&&!X(n));break}if(X(n))break;for(t=e.position;0!==n&&!te(n);)n=e.input.charCodeAt(++e.position);o.push(e.input.slice(t,e.position))}0!==n&&be(e),G.call(fe,i)?fe[i](e,i,o):_e(e,'unknown document directive "'+i+'"')}xe(e,!0,-1),0===e.lineIndent&&45===e.input.charCodeAt(e.position)&&45===e.input.charCodeAt(e.position+1)&&45===e.input.charCodeAt(e.position+2)?(e.position+=3,xe(e,!0,-1)):a&&ge(e,"directives end mark is expected"),ze(e,e.lineIndent-1,4,!1,!0),xe(e,!0,-1),e.checkLineBreaks&&W.test(e.input.slice(r,e.position))&&_e(e,"non-ASCII line breaks are interpreted as content"),e.documents.push(e.result),e.position===e.lineStart&&we(e)?46===e.input.charCodeAt(e.position)&&(e.position+=3,xe(e,!0,-1)):e.position<e.length-1&&ge(e,"end of the stream or a document separator is expected")}function Oe(e,t){t=t||{},0!==(e=String(e)).length&&(10!==e.charCodeAt(e.length-1)&&13!==e.charCodeAt(e.length-1)&&(e+="\n"),65279===e.charCodeAt(0)&&(e=e.slice(1)));var i=new ue(e,t),o=e.indexOf("\0");for(-1!==o&&(i.position=o,ge(i,"null byte is not allowed in input")),i.input+="\0";32===i.input.charCodeAt(i.position);)i.lineIndent+=1,i.position+=1;for(;i.position<i.length-1;)Se(i);return i.documents}var Ee={loadAll:function(e,t,i){null!==t&&"object"==typeof t&&void 0===i&&(i=t,t=null);var o=Oe(e,i);if("function"!=typeof t)return o;for(var n=0,r=o.length;n<r;n+=1)t(o[n])},load:function(e,t){var i=Oe(e,t);if(0!==i.length){if(1===i.length)return i[0];throw new c("expected a single document in the stream, but found more")}}},je=Object.prototype.toString,Ie=Object.prototype.hasOwnProperty,Fe=65279,qe={0:"\\0",7:"\\a",8:"\\b",9:"\\t",10:"\\n",11:"\\v",12:"\\f",13:"\\r",27:"\\e",34:'\\"',92:"\\\\",133:"\\N",160:"\\_",8232:"\\L",8233:"\\P"},Te=["y","Y","yes","Yes","YES","on","On","ON","n","N","no","No","NO","off","Off","OFF"],Ne=/^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;function Le(e){var t,i,o;if(t=e.toString(16).toUpperCase(),e<=255)i="x",o=2;else if(e<=65535)i="u",o=4;else{if(!(e<=4294967295))throw new c("code point within a string may not be greater than 0xFFFFFFFF");i="U",o=8}return"\\"+i+r.repeat("0",o-t.length)+t}function Me(e){this.schema=e.schema||P,this.indent=Math.max(1,e.indent||2),this.noArrayIndent=e.noArrayIndent||!1,this.skipInvalid=e.skipInvalid||!1,this.flowLevel=r.isNothing(e.flowLevel)?-1:e.flowLevel,this.styleMap=function(e,t){var i,o,n,r,a,s,c;if(null===t)return{};for(i={},n=0,r=(o=Object.keys(t)).length;n<r;n+=1)a=o[n],s=String(t[a]),"!!"===a.slice(0,2)&&(a="tag:yaml.org,2002:"+a.slice(2)),(c=e.compiledTypeMap.fallback[a])&&Ie.call(c.styleAliases,s)&&(s=c.styleAliases[s]),i[a]=s;return i}(this.schema,e.styles||null),this.sortKeys=e.sortKeys||!1,this.lineWidth=e.lineWidth||80,this.noRefs=e.noRefs||!1,this.noCompatMode=e.noCompatMode||!1,this.condenseFlow=e.condenseFlow||!1,this.quotingType='"'===e.quotingType?2:1,this.forceQuotes=e.forceQuotes||!1,this.replacer="function"==typeof e.replacer?e.replacer:null,this.implicitTypes=this.schema.compiledImplicit,this.explicitTypes=this.schema.compiledExplicit,this.tag=null,this.result="",this.duplicates=[],this.usedDuplicates=null}function De(e,t){for(var i,o=r.repeat(" ",t),n=0,a=-1,s="",c=e.length;n<c;)-1===(a=e.indexOf("\n",n))?(i=e.slice(n),n=c):(i=e.slice(n,a+1),n=a+1),i.length&&"\n"!==i&&(s+=o),s+=i;return s}function Ve(e,t){return"\n"+r.repeat(" ",e.indent*t)}function Ye(e){return 32===e||9===e}function Be(e){return 32<=e&&e<=126||161<=e&&e<=55295&&8232!==e&&8233!==e||57344<=e&&e<=65533&&e!==Fe||65536<=e&&e<=1114111}function Ue(e){return Be(e)&&e!==Fe&&13!==e&&10!==e}function Re(e,t,i){var o=Ue(e),n=o&&!Ye(e);return(i?o:o&&44!==e&&91!==e&&93!==e&&123!==e&&125!==e)&&35!==e&&!(58===t&&!n)||Ue(t)&&!Ye(t)&&35===e||58===t&&n}function Pe(e,t){var i,o=e.charCodeAt(t);return o>=55296&&o<=56319&&t+1<e.length&&(i=e.charCodeAt(t+1))>=56320&&i<=57343?1024*(o-55296)+i-56320+65536:o}function Ge(e){return/^\n* /.test(e)}function He(e,t,i,o,n){e.dump=function(){if(0===t.length)return 2===e.quotingType?'""':"''";if(!e.noCompatMode&&(-1!==Te.indexOf(t)||Ne.test(t)))return 2===e.quotingType?'"'+t+'"':"'"+t+"'";var r=e.indent*Math.max(1,i),a=-1===e.lineWidth?-1:Math.max(Math.min(e.lineWidth,40),e.lineWidth-r),s=o||e.flowLevel>-1&&i>=e.flowLevel;switch(function(e,t,i,o,n,r,a,s){var c,l,d=0,p=null,u=!1,h=!1,g=-1!==o,_=-1,f=Be(l=Pe(e,0))&&l!==Fe&&!Ye(l)&&45!==l&&63!==l&&58!==l&&44!==l&&91!==l&&93!==l&&123!==l&&125!==l&&35!==l&&38!==l&&42!==l&&33!==l&&124!==l&&61!==l&&62!==l&&39!==l&&34!==l&&37!==l&&64!==l&&96!==l&&function(e){return!Ye(e)&&58!==e}(Pe(e,e.length-1));if(t||a)for(c=0;c<e.length;d>=65536?c+=2:c++){if(!Be(d=Pe(e,c)))return 5;f=f&&Re(d,p,s),p=d}else{for(c=0;c<e.length;d>=65536?c+=2:c++){if(10===(d=Pe(e,c)))u=!0,g&&(h=h||c-_-1>o&&" "!==e[_+1],_=c);else if(!Be(d))return 5;f=f&&Re(d,p,s),p=d}h=h||g&&c-_-1>o&&" "!==e[_+1]}return u||h?i>9&&Ge(e)?5:a?2===r?5:2:h?4:3:!f||a||n(e)?2===r?5:2:1}(t,s,e.indent,a,function(t){return function(e,t){var i,o;for(i=0,o=e.implicitTypes.length;i<o;i+=1)if(e.implicitTypes[i].resolve(t))return!0;return!1}(e,t)},e.quotingType,e.forceQuotes&&!o,n)){case 1:return t;case 2:return"'"+t.replace(/'/g,"''")+"'";case 3:return"|"+We(t,e.indent)+Ke(De(t,r));case 4:return">"+We(t,e.indent)+Ke(De(function(e,t){for(var i,o,n,r=/(\n+)([^\n]*)/g,a=(n=-1!==(n=e.indexOf("\n"))?n:e.length,r.lastIndex=n,Ze(e.slice(0,n),t)),s="\n"===e[0]||" "===e[0];o=r.exec(e);){var c=o[1],l=o[2];i=" "===l[0],a+=c+(s||i||""===l?"":"\n")+Ze(l,t),s=i}return a}(t,a),r));case 5:return'"'+function(e){for(var t,i="",o=0,n=0;n<e.length;o>=65536?n+=2:n++)o=Pe(e,n),!(t=qe[o])&&Be(o)?(i+=e[n],o>=65536&&(i+=e[n+1])):i+=t||Le(o);return i}(t)+'"';default:throw new c("impossible error: invalid scalar style")}}()}function We(e,t){var i=Ge(e)?String(t):"",o="\n"===e[e.length-1];return i+(!o||"\n"!==e[e.length-2]&&"\n"!==e?o?"":"-":"+")+"\n"}function Ke(e){return"\n"===e[e.length-1]?e.slice(0,-1):e}function Ze(e,t){if(""===e||" "===e[0])return e;for(var i,o,n=/ [^ ]/g,r=0,a=0,s=0,c="";i=n.exec(e);)(s=i.index)-r>t&&(o=a>r?a:s,c+="\n"+e.slice(r,o),r=o+1),a=s;return c+="\n",e.length-r>t&&a>r?c+=e.slice(r,a)+"\n"+e.slice(a+1):c+=e.slice(r),c.slice(1)}function Qe(e,t,i,o){var n,r,a,s="",c=e.tag;for(n=0,r=i.length;n<r;n+=1)a=i[n],e.replacer&&(a=e.replacer.call(i,String(n),a)),(Xe(e,t+1,a,!0,!0,!1,!0)||void 0===a&&Xe(e,t+1,null,!0,!0,!1,!0))&&(o&&""===s||(s+=Ve(e,t)),e.dump&&10===e.dump.charCodeAt(0)?s+="-":s+="- ",s+=e.dump);e.tag=c,e.dump=s||"[]"}function Je(e,t,i){var o,n,r,a,s,l;for(r=0,a=(n=i?e.explicitTypes:e.implicitTypes).length;r<a;r+=1)if(((s=n[r]).instanceOf||s.predicate)&&(!s.instanceOf||"object"==typeof t&&t instanceof s.instanceOf)&&(!s.predicate||s.predicate(t))){if(i?s.multi&&s.representName?e.tag=s.representName(t):e.tag=s.tag:e.tag="?",s.represent){if(l=e.styleMap[s.tag]||s.defaultStyle,"[object Function]"===je.call(s.represent))o=s.represent(t,l);else{if(!Ie.call(s.represent,l))throw new c("!<"+s.tag+'> tag resolver accepts not "'+l+'" style');o=s.represent[l](t,l)}e.dump=o}return!0}return!1}function Xe(e,t,i,o,n,r,a){e.tag=null,e.dump=i,Je(e,i,!1)||Je(e,i,!0);var s,l=je.call(e.dump),d=o;o&&(o=e.flowLevel<0||e.flowLevel>t);var p,u,h="[object Object]"===l||"[object Array]"===l;if(h&&(u=-1!==(p=e.duplicates.indexOf(i))),(null!==e.tag&&"?"!==e.tag||u||2!==e.indent&&t>0)&&(n=!1),u&&e.usedDuplicates[p])e.dump="*ref_"+p;else{if(h&&u&&!e.usedDuplicates[p]&&(e.usedDuplicates[p]=!0),"[object Object]"===l)o&&0!==Object.keys(e.dump).length?(function(e,t,i,o){var n,r,a,s,l,d,p="",u=e.tag,h=Object.keys(i);if(!0===e.sortKeys)h.sort();else if("function"==typeof e.sortKeys)h.sort(e.sortKeys);else if(e.sortKeys)throw new c("sortKeys must be a boolean or a function");for(n=0,r=h.length;n<r;n+=1)d="",o&&""===p||(d+=Ve(e,t)),s=i[a=h[n]],e.replacer&&(s=e.replacer.call(i,a,s)),Xe(e,t+1,a,!0,!0,!0)&&((l=null!==e.tag&&"?"!==e.tag||e.dump&&e.dump.length>1024)&&(e.dump&&10===e.dump.charCodeAt(0)?d+="?":d+="? "),d+=e.dump,l&&(d+=Ve(e,t)),Xe(e,t+1,s,!0,l)&&(e.dump&&10===e.dump.charCodeAt(0)?d+=":":d+=": ",p+=d+=e.dump));e.tag=u,e.dump=p||"{}"}(e,t,e.dump,n),u&&(e.dump="&ref_"+p+e.dump)):(function(e,t,i){var o,n,r,a,s,c="",l=e.tag,d=Object.keys(i);for(o=0,n=d.length;o<n;o+=1)s="",""!==c&&(s+=", "),e.condenseFlow&&(s+='"'),a=i[r=d[o]],e.replacer&&(a=e.replacer.call(i,r,a)),Xe(e,t,r,!1,!1)&&(e.dump.length>1024&&(s+="? "),s+=e.dump+(e.condenseFlow?'"':"")+":"+(e.condenseFlow?"":" "),Xe(e,t,a,!1,!1)&&(c+=s+=e.dump));e.tag=l,e.dump="{"+c+"}"}(e,t,e.dump),u&&(e.dump="&ref_"+p+" "+e.dump));else if("[object Array]"===l)o&&0!==e.dump.length?(e.noArrayIndent&&!a&&t>0?Qe(e,t-1,e.dump,n):Qe(e,t,e.dump,n),u&&(e.dump="&ref_"+p+e.dump)):(function(e,t,i){var o,n,r,a="",s=e.tag;for(o=0,n=i.length;o<n;o+=1)r=i[o],e.replacer&&(r=e.replacer.call(i,String(o),r)),(Xe(e,t,r,!1,!1)||void 0===r&&Xe(e,t,null,!1,!1))&&(""!==a&&(a+=","+(e.condenseFlow?"":" ")),a+=e.dump);e.tag=s,e.dump="["+a+"]"}(e,t,e.dump),u&&(e.dump="&ref_"+p+" "+e.dump));else{if("[object String]"!==l){if("[object Undefined]"===l)return!1;if(e.skipInvalid)return!1;throw new c("unacceptable kind of an object to dump "+l)}"?"!==e.tag&&He(e,e.dump,t,r,d)}null!==e.tag&&"?"!==e.tag&&(s=encodeURI("!"===e.tag[0]?e.tag.slice(1):e.tag).replace(/!/g,"%21"),s="!"===e.tag[0]?"!"+s:"tag:yaml.org,2002:"===s.slice(0,18)?"!!"+s.slice(18):"!<"+s+">",e.dump=s+" "+e.dump)}return!0}function et(e,t){var i,o,n=[],r=[];for(tt(e,n,r),i=0,o=r.length;i<o;i+=1)t.duplicates.push(n[r[i]]);t.usedDuplicates=new Array(o)}function tt(e,t,i){var o,n,r;if(null!==e&&"object"==typeof e)if(-1!==(n=t.indexOf(e)))-1===i.indexOf(n)&&i.push(n);else if(t.push(e),Array.isArray(e))for(n=0,r=e.length;n<r;n+=1)tt(e[n],t,i);else for(n=0,r=(o=Object.keys(e)).length;n<r;n+=1)tt(e[o[n]],t,i)}function it(e,t){return function(){throw new Error("Function yaml."+e+" is removed in js-yaml 4. Use yaml."+t+" instead, which is now safe by default.")}}var ot={Type:h,Schema:f,FAILSAFE_SCHEMA:b,JSON_SCHEMA:E,CORE_SCHEMA:j,DEFAULT_SCHEMA:P,load:Ee.load,loadAll:Ee.loadAll,dump:function(e,t){var i=new Me(t=t||{});i.noRefs||et(e,i);var o=e;return i.replacer&&(o=i.replacer.call({"":o},"",o)),Xe(i,0,o,!0,!0)?i.dump+"\n":""},YAMLException:c,types:{binary:L,float:O,map:y,null:x,pairs:B,set:R,timestamp:q,bool:w,int:A,merge:T,omap:V,seq:v,str:m},safeLoad:it("safeLoad","load"),safeLoadAll:it("safeLoadAll","loadAll"),safeDump:it("safeDump","dump")},nt=i(475),rt=i(113);class at extends o.WF{constructor(){super(...arguments),this._hass=null,this._isUpdatingConfig=!1,this._config={},this._expandedAreas=new Set,this._expandedGroups=new Map,this._areaEntitiesCache=new Map,this._draggedElement=null,this._handleDragStart=e=>{if(!e.target.closest(".drag-handle"))return void e.preventDefault();const t=e.target.closest(".area-item");t?(t.classList.add("dragging"),e.dataTransfer&&(e.dataTransfer.effectAllowed="move",e.dataTransfer.setData("text/plain",t.dataset.areaId||"")),this._draggedElement=t):e.preventDefault()},this._handleDragEnd=e=>{const t=e.target.closest(".area-item");t&&t.classList.remove("dragging");const i=this.shadowRoot.querySelector("#area-list");i&&i.querySelectorAll(".area-item").forEach(e=>{e.classList.remove("drag-over")})},this._handleDragOver=e=>{e.preventDefault(),e.dataTransfer.dropEffect="move";const t=e.currentTarget;t!==this._draggedElement&&t.classList.add("drag-over")},this._handleDragLeave=e=>{e.currentTarget.classList.remove("drag-over")},this._handleDrop=e=>{e.stopPropagation(),e.preventDefault();const t=e.currentTarget;if(t.classList.remove("drag-over"),!this._draggedElement||this._draggedElement===t)return;const i=this.shadowRoot.querySelector("#area-list");if(!i)return;const o=Array.from(i.querySelectorAll(".area-item"));o.indexOf(this._draggedElement)<o.indexOf(t)?t.parentNode.insertBefore(this._draggedElement,t.nextSibling):t.parentNode.insertBefore(this._draggedElement,t),this._updateAreaOrder()}}set hass(e){const t=this._hass;this._hass=e,t||this.requestUpdate()}setConfig(e){this._isUpdatingConfig||(this._config=e)}_checkSearchCardDependencies(){const e=void 0!==customElements.get("search-card"),t=void 0!==customElements.get("card-tools");return e&&t}_getAllEntitiesForSelect(){if(!this._hass)return[];const e=Object.values(this._hass.entities),t=Object.values(this._hass.devices),i=new Map;t.forEach(e=>{e.area_id&&i.set(e.id,e.area_id)});const o=this._hass;return Object.keys(o.states).map(t=>{const n=o.states[t],r=e.find(e=>e.entity_id===t);let a=r?.area_id;return!a&&r?.device_id&&(a=i.get(r.device_id)??null),{entity_id:t,name:n.attributes?.friendly_name||t.split(".")[1].replace(/_/g," "),area_id:a,device_area_id:a}}).sort((e,t)=>e.name.localeCompare(t.name))}_getAlarmEntities(){return this._hass?Object.keys(this._hass.states).filter(e=>e.startsWith("alarm_control_panel.")).map(e=>{const t=this._hass.states[e];return{entity_id:e,name:t.attributes?.friendly_name||e.split(".")[1].replace(/_/g," ")}}).sort((e,t)=>e.name.localeCompare(t.name)):[]}render(){return this._hass?o.qy`
      <div class="card-config">
        ${this._renderOverviewSection()}
        ${this._renderSummariesSection()}
        ${this._renderInfoCardsSection()}
        ${this._renderFavoritesSection()}

        <div style="border-top: 2px solid var(--divider-color); margin: 24px 0 16px; padding-top: 16px;">
          <div style="font-size: 16px; font-weight: 600; color: var(--primary-text-color); margin-bottom: 4px;">
            ${(0,nt.localize)("editor.section_areas_rooms")}
          </div>
        </div>

        ${this._renderAreasSection()}
        ${this._renderRoomPinsSection()}
        ${this._renderViewsSection()}

        <div style="border-top: 2px solid var(--divider-color); margin: 24px 0 16px; padding-top: 16px;">
          <div style="font-size: 16px; font-weight: 600; color: var(--primary-text-color); margin-bottom: 4px;">
            ${(0,nt.localize)("editor.section_advanced")}
          </div>
        </div>

        ${this._renderCustomCardsSection()}
        ${this._renderCustomBadgesSection()}
        ${this._renderCustomViewsSection()}
      </div>
    `:o.s6}_renderOverviewSection(){const e=!1!==this._config.show_clock_card,t=!0===this._config.show_search_card,i=this._checkSearchCardDependencies(),n=this._config.alarm_entity||"",r=this._getAlarmEntities();return o.qy`
      <div class="section">
        <div class="section-title">${(0,nt.localize)("editor.section_overview")}</div>

        ${this._renderCheckbox("show-clock-card",(0,nt.localize)("editor.show_clock_card"),e,e=>this._toggleChanged("show_clock_card",e,!0))}
        <div class="description">${(0,nt.localize)("editor.show_clock_card_desc")}</div>

        <div class="form-row">
          <label for="alarm-entity" style="margin-right: 8px; min-width: 120px;">${(0,nt.localize)("editor.alarm_entity")}</label>
          <select id="alarm-entity"
            style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
            @change=${this._alarmEntityChanged}>
            <option value="" ?selected=${!n}>${(0,nt.localize)("editor.alarm_none")}</option>
            ${r.map(e=>o.qy`
              <option value=${e.entity_id} ?selected=${e.entity_id===n}>
                ${e.name}
              </option>
            `)}
          </select>
        </div>
        <div class="description">${(0,nt.localize)("editor.alarm_desc")}</div>

        ${this._renderCheckbox("show-search-card",(0,nt.localize)("editor.show_search_card"),t,e=>this._toggleChanged("show_search_card",e,!1),!i)}
        <div class="description">
          ${i?(0,nt.localize)("editor.show_search_card_desc"):o.qy`<span>&#x26A0;&#xFE0F; ${(0,nt.localize)("editor.show_search_card_missing")}</span>`}
        </div>
      </div>
    `}_renderSummariesSection(){const e=this._config.summaries_columns||2,t=!1!==this._config.show_light_summary,i=!0===this._config.group_lights_by_floors,n=!0===this._config.nested_light_groups,r=!1!==this._config.show_covers_summary,a=!0===this._config.show_partially_open_covers,s=!1!==this._config.show_security_summary,c=!0===this._config.show_climate_summary,l=!1!==this._config.show_battery_summary,d=!0===this._config.hide_mobile_app_batteries,p=this._config.battery_critical_threshold??20,u=this._config.battery_low_threshold??50;return o.qy`
      <div class="section">
        <div class="section-title">${(0,nt.localize)("editor.section_summaries")}</div>

        <div class="form-row">
          <input type="radio" id="summaries-2-columns" name="summaries-columns" value="2"
            ?checked=${2===e}
            @change=${()=>this._summariesColumnsChanged(2)} />
          <label for="summaries-2-columns">${(0,nt.localize)("editor.columns_2")}</label>
        </div>
        <div class="form-row">
          <input type="radio" id="summaries-4-columns" name="summaries-columns" value="4"
            ?checked=${4===e}
            @change=${()=>this._summariesColumnsChanged(4)} />
          <label for="summaries-4-columns">${(0,nt.localize)("editor.columns_4")}</label>
        </div>
        <div class="description">${(0,nt.localize)("editor.columns_desc")}</div>

        ${this._renderCheckbox("show-light-summary",(0,nt.localize)("editor.show_light_summary"),t,e=>this._toggleChanged("show_light_summary",e,!0))}

        ${this._renderCheckbox("group-lights-by-floors",(0,nt.localize)("editor.group_lights_by_floors"),i,e=>this._toggleChanged("group_lights_by_floors",e,!1))}
        <div class="description">${(0,nt.localize)("editor.group_lights_by_floors_desc")}</div>

        ${this._renderCheckbox("nested-light-groups",(0,nt.localize)("editor.nested_light_groups"),n,e=>this._toggleChanged("nested_light_groups",e,!1))}
        <div class="description">${(0,nt.localize)("editor.nested_light_groups_desc")}</div>

        ${this._renderCheckbox("show-covers-summary",(0,nt.localize)("editor.show_covers_summary"),r,e=>this._toggleChanged("show_covers_summary",e,!0))}

        <div style="margin-left: 26px; margin-bottom: 8px;">
          ${this._renderCheckbox("show-partially-open-covers",(0,nt.localize)("editor.show_partially_open_covers"),a,e=>this._toggleChanged("show_partially_open_covers",e,!1))}
          <div class="description">${(0,nt.localize)("editor.show_partially_open_covers_desc")}</div>
        </div>

        ${this._renderCheckbox("show-security-summary",(0,nt.localize)("editor.show_security_summary"),s,e=>this._toggleChanged("show_security_summary",e,!0))}

        ${this._renderCheckbox("show-climate-summary",(0,nt.localize)("editor.show_climate_summary"),c,e=>this._toggleChanged("show_climate_summary",e,!1))}
        <div class="description">${(0,nt.localize)("editor.show_climate_summary_desc")}</div>

        ${this._renderCheckbox("show-battery-summary",(0,nt.localize)("editor.show_battery_summary"),l,e=>this._toggleChanged("show_battery_summary",e,!0))}

        <div style="margin-left: 26px; margin-bottom: 8px;">
          ${this._renderCheckbox("hide-mobile-app-batteries",(0,nt.localize)("editor.hide_mobile_app_batteries"),d,e=>this._toggleChanged("hide_mobile_app_batteries",e,!1))}
          <div class="description">${(0,nt.localize)("editor.hide_mobile_app_batteries_desc")}</div>

          <div style="font-size: 13px; font-weight: 500; color: var(--primary-text-color); margin-top: 12px; margin-bottom: 4px;">
            ${(0,nt.localize)("editor.battery_thresholds")}
          </div>
          <div class="form-row">
            <label for="battery-critical-threshold" style="min-width: 140px;">${(0,nt.localize)("editor.battery_critical_below")}</label>
            <input type="number" id="battery-critical-threshold" min="1" max="99"
              .value=${String(p)}
              style="width: 60px; padding: 6px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
              @change=${this._batteryCriticalChanged} /> %
          </div>
          <div class="form-row">
            <label for="battery-low-threshold" style="min-width: 140px;">${(0,nt.localize)("editor.battery_low_below")}</label>
            <input type="number" id="battery-low-threshold" min="1" max="99"
              .value=${String(u)}
              style="width: 60px; padding: 6px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
              @change=${this._batteryLowChanged} /> %
          </div>
          <div class="description">${(0,nt.localize)("editor.battery_thresholds_desc")}</div>
        </div>
      </div>
    `}_renderInfoCardsSection(){const e=!1!==this._config.show_weather,t=!1!==this._config.show_energy;return o.qy`
      <div class="section">
        <div class="section-title">${(0,nt.localize)("editor.section_info_cards")}</div>

        ${this._renderCheckbox("show-weather",(0,nt.localize)("editor.show_weather"),e,e=>this._toggleChanged("show_weather",e,!0))}
        <div class="description">${(0,nt.localize)("editor.show_weather_desc")}</div>

        ${this._renderCheckbox("show-energy",(0,nt.localize)("editor.show_energy"),t,e=>this._toggleChanged("show_energy",e,!0))}
        <div class="description">${(0,nt.localize)("editor.show_energy_desc")}</div>
      </div>
    `}_renderFavoritesSection(){const e=this._config.favorite_entities||[],t=this._getAllEntitiesForSelect(),i=!0===this._config.favorites_show_state,n=!0===this._config.favorites_hide_last_changed,r=new Map(t.map(e=>[e.entity_id,e.name]));return o.qy`
      <div class="section">
        <div class="section-title">${(0,nt.localize)("editor.section_favorites")}</div>

        <div id="favorites-list" style="margin-bottom: 12px;">
          ${0===e.length?o.qy`<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">${(0,nt.localize)("editor.no_favorites")}</div>`:o.qy`
              <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
                ${e.map(e=>{const t=r.get(e)||e;return o.qy`
                    <div class="favorite-item" data-entity-id=${e} style="display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); background: var(--card-background-color);">
                      <span style="margin-right: 12px; color: var(--secondary-text-color);">&#x2630;</span>
                      <span style="flex: 1; font-size: 14px;">
                        <strong>${t}</strong>
                        <span style="margin-left: 8px; font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">${e}</span>
                      </span>
                      <button @click=${()=>this._removeFavoriteEntity(e)}
                        style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer;">
                        &#x2715;
                      </button>
                    </div>
                  `})}
              </div>
            `}
        </div>

        <div style="display: flex; gap: 8px; align-items: flex-start;">
          <select id="favorite-entity-select"
            style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
            <option value="">${(0,nt.localize)("editor.select_entity")}</option>
            ${t.map(e=>o.qy`
              <option value=${e.entity_id}>${e.name}</option>
            `)}
          </select>
          <button @click=${this._addFavoriteFromSelect}
            style="flex-shrink: 0; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer; white-space: nowrap;">
            ${(0,nt.localize)("editor.add")}
          </button>
        </div>
        <div class="description">${(0,nt.localize)("editor.favorites_desc")}</div>

        ${this._renderCheckbox("favorites-show-state",(0,nt.localize)("editor.show_state"),i,e=>this._toggleChanged("favorites_show_state",e,!1))}

        ${this._renderCheckbox("favorites-hide-last-changed",(0,nt.localize)("editor.hide_last_changed"),n,e=>this._toggleChanged("favorites_hide_last_changed",e,!1))}
      </div>
    `}_renderAreasSection(){const e=!0===this._config.group_by_floors,t=!0===this._config.show_switches_on_areas,i=!0===this._config.show_alerts_on_areas,n=!0===this._config.show_locks_in_rooms,r=!0===this._config.show_automations_in_rooms,a=!0===this._config.show_scripts_in_rooms,s=!0===this._config.use_default_area_sort,c=Object.values(this._hass.areas).sort((e,t)=>e.name.localeCompare(t.name)),l=this._config.areas_display?.hidden||[],d=this._config.areas_display?.order||[];return o.qy`
      <div class="section">
        <div class="section-title">${(0,nt.localize)("editor.section_areas")}</div>

        ${this._renderCheckbox("group-by-floors",(0,nt.localize)("editor.group_by_floors"),e,e=>this._toggleChanged("group_by_floors",e,!1))}
        <div class="description">${(0,nt.localize)("editor.group_by_floors_desc")}</div>

        ${this._renderCheckbox("show-switches-on-areas",(0,nt.localize)("editor.show_switches_on_areas"),t,e=>this._toggleChanged("show_switches_on_areas",e,!1))}
        <div class="description">${(0,nt.localize)("editor.show_switches_on_areas_desc")}</div>

        ${this._renderCheckbox("show-alerts-on-areas",(0,nt.localize)("editor.show_alerts_on_areas"),i,e=>this._toggleChanged("show_alerts_on_areas",e,!1))}
        <div class="description">${(0,nt.localize)("editor.show_alerts_on_areas_desc")}</div>

        ${this._renderCheckbox("show-locks-in-rooms",(0,nt.localize)("editor.show_locks_in_rooms"),n,e=>this._toggleChanged("show_locks_in_rooms",e,!1))}
        <div class="description">${(0,nt.localize)("editor.show_locks_in_rooms_desc")}</div>

        ${this._renderCheckbox("show-automations-in-rooms",(0,nt.localize)("editor.show_automations_in_rooms"),r,e=>this._toggleChanged("show_automations_in_rooms",e,!1))}
        <div class="description">${(0,nt.localize)("editor.show_automations_in_rooms_desc")}</div>

        ${this._renderCheckbox("show-scripts-in-rooms",(0,nt.localize)("editor.show_scripts_in_rooms"),a,e=>this._toggleChanged("show_scripts_in_rooms",e,!1))}
        <div class="description">${(0,nt.localize)("editor.show_scripts_in_rooms_desc")}</div>

        ${this._renderCheckbox("use-default-area-sort",(0,nt.localize)("editor.use_default_area_sort"),s,e=>this._toggleChanged("use_default_area_sort",e,!1))}
        <div class="description">${(0,nt.localize)("editor.use_default_area_sort_desc")}</div>

        <div class="description" style="margin-left: 0; margin-top: 16px; margin-bottom: 12px;">
          ${(0,nt.localize)("editor.areas_manage_desc")}
        </div>

        <div class="area-list" id="area-list">
          ${this._renderAreaItems(c,l,d)}
        </div>
      </div>
    `}_renderRoomPinsSection(){const e=this._config.room_pin_entities||[],t=this._getAllEntitiesForSelect(),i=Object.values(this._hass.areas).sort((e,t)=>e.name.localeCompare(t.name)),n=!0===this._config.room_pins_show_state,r=!0===this._config.room_pins_hide_last_changed,a=new Map(t.map(e=>[e.entity_id,e])),s=new Map(i.map(e=>[e.area_id,e.name]));return o.qy`
      <div class="section">
        <div class="section-title">${(0,nt.localize)("editor.section_room_pins")}</div>

        <div id="room-pins-list" style="margin-bottom: 12px;">
          ${0===e.length?o.qy`<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">${(0,nt.localize)("editor.no_room_pins")}</div>`:o.qy`
              <div style="border: 1px solid var(--divider-color); border-radius: 4px; overflow: hidden;">
                ${e.map(e=>{const t=a.get(e),i=t?.name||e,n=t?.area_id||t?.device_area_id,r=n?s.get(n)||n:(0,nt.localize)("editor.no_room");return o.qy`
                    <div class="room-pin-item" data-entity-id=${e} style="display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); background: var(--card-background-color);">
                      <span style="margin-right: 12px; color: var(--secondary-text-color);">&#x2630;</span>
                      <span style="flex: 1; font-size: 14px;">
                        <strong>${i}</strong>
                        <span style="margin-left: 8px; font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">${e}</span>
                        <br>
                        <span style="font-size: 11px; color: var(--secondary-text-color);">&#x1F4CD; ${r}</span>
                      </span>
                      <button @click=${()=>this._removeRoomPinEntity(e)}
                        style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer;">
                        &#x2715;
                      </button>
                    </div>
                  `})}
              </div>
            `}
        </div>

        <div style="display: flex; gap: 8px; align-items: flex-start;">
          <select id="room-pin-entity-select"
            style="flex: 1; min-width: 0; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);">
            <option value="">${(0,nt.localize)("editor.select_entity")}</option>
            ${t.filter(e=>e.area_id||e.device_area_id).map(e=>o.qy`
                <option value=${e.entity_id}>${e.name}</option>
              `)}
          </select>
          <button @click=${this._addRoomPinFromSelect}
            style="flex-shrink: 0; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer; white-space: nowrap;">
            ${(0,nt.localize)("editor.add")}
          </button>
        </div>
        <div class="description">${(0,nt.localize)("editor.room_pins_desc")}</div>

        ${this._renderCheckbox("room-pins-show-state",(0,nt.localize)("editor.show_state"),n,e=>this._toggleChanged("room_pins_show_state",e,!1))}

        ${this._renderCheckbox("room-pins-hide-last-changed",(0,nt.localize)("editor.hide_last_changed"),r,e=>this._toggleChanged("room_pins_hide_last_changed",e,!1))}
      </div>
    `}_renderViewsSection(){const e=!0===this._config.show_summary_views,t=!0===this._config.show_room_views;return o.qy`
      <div class="section">
        <div class="section-title">${(0,nt.localize)("editor.section_views")}</div>

        ${this._renderCheckbox("show-summary-views",(0,nt.localize)("editor.show_summary_views"),e,e=>this._toggleChanged("show_summary_views",e,!1))}
        <div class="description">${(0,nt.localize)("editor.show_summary_views_desc")}</div>

        ${this._renderCheckbox("show-room-views",(0,nt.localize)("editor.show_room_views"),t,e=>this._toggleChanged("show_room_views",e,!1))}
        <div class="description">${(0,nt.localize)("editor.show_room_views_desc")}</div>
      </div>
    `}_renderCustomCardsSection(){const e=this._config.custom_cards||[],t=this._config.custom_cards_heading||"",i=this._config.custom_cards_icon||"";return o.qy`
      <div class="section">
        <div class="section-title" style="display: flex; align-items: center; gap: 8px;">
          ${(0,nt.localize)("editor.section_custom_cards")}
          <a href="https://github.com/TheRealSimon42/simon42-dashboard-strategy/blob/main/assets/Eigene-Karten-hinzufugen.gif"
            target="_blank" rel="noopener"
            style="color: var(--primary-color); text-decoration: none; font-size: 18px;"
            title=${(0,nt.localize)("editor.video_tutorial")}>&#x1F3AC;</a>
        </div>
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <input type="text" id="custom-cards-heading"
            .value=${t}
            placeholder=${(0,nt.localize)("editor.custom_cards_heading_placeholder")}
            style="flex: 2; padding: 6px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
            @change=${this._customCardsHeadingChanged} />
          <input type="text" id="custom-cards-icon"
            .value=${i}
            placeholder="mdi:cards"
            style="flex: 1; padding: 6px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
            @change=${this._customCardsIconChanged} />
        </div>
        <div class="description" style="margin-bottom: 8px;">${(0,nt.localize)("editor.custom_cards_desc")}</div>

        <div id="custom-cards-list">
          ${0===e.length?o.qy`<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">${(0,nt.localize)("editor.no_custom_cards")}</div>`:e.map((e,t)=>this._renderCustomCardItem(e,t))}
        </div>

        <button @click=${this._addCustomCard}
          style="margin-top: 8px; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer;">
          ${(0,nt.localize)("editor.add_custom_card")}
        </button>
        <div class="description">${(0,nt.localize)("editor.custom_cards_help")}</div>
      </div>
    `}_renderCustomBadgesSection(){const e=this._config.custom_badges||[];return o.qy`
      <div class="section">
        <div class="section-title" style="display: flex; align-items: center; gap: 8px;">
          ${(0,nt.localize)("editor.section_custom_badges")}
          <a href="https://github.com/TheRealSimon42/simon42-dashboard-strategy/blob/main/assets/Custom-Badges-hinzufugen.gif"
            target="_blank" rel="noopener"
            style="color: var(--primary-color); text-decoration: none; font-size: 18px;"
            title=${(0,nt.localize)("editor.video_tutorial")}>&#x1F3AC;</a>
        </div>

        <div id="custom-badges-list">
          ${0===e.length?o.qy`<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">${(0,nt.localize)("editor.no_custom_badges")}</div>`:e.map((e,t)=>this._renderCustomBadgeItem(e,t))}
        </div>

        <button @click=${this._addCustomBadge}
          style="margin-top: 8px; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer;">
          ${(0,nt.localize)("editor.add_custom_badge")}
        </button>
        <div class="description">${(0,nt.localize)("editor.custom_badges_help")}</div>
      </div>
    `}_renderCustomViewsSection(){const e=this._config.custom_views||[];return o.qy`
      <div class="section">
        <div class="section-title" style="display: flex; align-items: center; gap: 8px;">
          ${(0,nt.localize)("editor.section_custom_views")}
          <a href="https://github.com/TheRealSimon42/simon42-dashboard-strategy/blob/main/assets/Custom-View-hinzufugen.gif"
            target="_blank" rel="noopener"
            style="color: var(--primary-color); text-decoration: none; font-size: 18px;"
            title=${(0,nt.localize)("editor.video_tutorial")}>&#x1F3AC;</a>
        </div>

        <div id="custom-views-list">
          ${0===e.length?o.qy`<div class="empty-state" style="padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic;">${(0,nt.localize)("editor.no_custom_views")}</div>`:e.map((e,t)=>this._renderCustomViewItem(e,t))}
        </div>

        <button @click=${this._addCustomView}
          style="margin-top: 8px; padding: 8px 16px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--primary-color); color: var(--text-primary-color); cursor: pointer;">
          ${(0,nt.localize)("editor.add_custom_view")}
        </button>
        <div class="description">${(0,nt.localize)("editor.custom_views_help")}</div>
      </div>
    `}_renderCheckbox(e,t,i,n,r=!1){return o.qy`
      <div class="form-row">
        <input type="checkbox" id=${e}
          ?checked=${i}
          ?disabled=${r}
          @change=${e=>n(e.target.checked)} />
        <label for=${e} class=${r?"disabled-label":""}>${t}</label>
      </div>
    `}_renderCustomViewItem(e,t){const i=e._yaml_error?o.qy`<span style="color: var(--error-color);">&#x274C; ${e._yaml_error}</span>`:e.yaml?o.qy`<span style="color: var(--success-color, green);">&#x2705; ${(0,nt.localize)("editor.yaml_valid")}</span>`:o.s6;return o.qy`
      <div class="custom-view-item" data-index=${t}
        style="border: 1px solid var(--divider-color); border-radius: 8px; padding: 12px; margin-bottom: 12px; background: var(--card-background-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 14px;">${e.title||(0,nt.localize)("editor.new_view")}</strong>
          <button @click=${()=>this._removeCustomView(t)}
            style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer;">&#x2715;</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 8px;">
            <input type="text" .value=${e.title||""} placeholder=${(0,nt.localize)("editor.title_placeholder")}
              style="flex: 2; padding: 6px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
              @change=${e=>this._updateCustomViewField(t,"title",e.target.value)} />
            <input type="text" .value=${e.path||""} placeholder=${(0,nt.localize)("editor.path_placeholder")}
              style="flex: 2; padding: 6px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
              @change=${e=>this._updateCustomViewField(t,"path",e.target.value)} />
            <input type="text" .value=${e.icon||""} placeholder="mdi:star"
              style="flex: 1; padding: 6px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
              @change=${e=>this._updateCustomViewField(t,"icon",e.target.value)} />
          </div>
          <textarea rows="8" placeholder=${(0,nt.localize)("editor.yaml_placeholder")}
            .value=${e.yaml||""}
            style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font-family: monospace; font-size: 12px; resize: vertical; box-sizing: border-box;"
            @change=${e=>this._updateCustomViewYaml(t,e.target.value)}></textarea>
          <div class="custom-view-validation" style="font-size: 12px; min-height: 16px;">
            ${i}
          </div>
        </div>
      </div>
    `}_renderCustomCardItem(e,t){const i=e._yaml_error?o.qy`<span style="color: var(--error-color);">&#x274C; ${e._yaml_error}</span>`:e.yaml?o.qy`<span style="color: var(--success-color, green);">&#x2705; ${(0,nt.localize)("editor.yaml_valid")}</span>`:o.s6;return o.qy`
      <div class="custom-card-item" data-index=${t}
        style="border: 1px solid var(--divider-color); border-radius: 8px; padding: 12px; margin-bottom: 12px; background: var(--card-background-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 14px;">${e.title||(0,nt.localize)("editor.new_card")}</strong>
          <button @click=${()=>this._removeCustomCard(t)}
            style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer;">&#x2715;</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <input type="text" .value=${e.title||""} placeholder=${(0,nt.localize)("editor.card_title_placeholder")}
            style="padding: 6px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color);"
            @change=${e=>this._updateCustomCardField(t,"title",e.target.value)} />
          <textarea rows="6" placeholder=${(0,nt.localize)("editor.yaml_placeholder")}
            .value=${e.yaml||""}
            style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font-family: monospace; font-size: 12px; resize: vertical; box-sizing: border-box;"
            @change=${e=>this._updateCustomCardYaml(t,e.target.value)}></textarea>
          <div class="custom-card-validation" style="font-size: 12px; min-height: 16px;">
            ${i}
          </div>
        </div>
      </div>
    `}_renderCustomBadgeItem(e,t){const i=e._yaml_error?o.qy`<span style="color: var(--error-color);">&#x274C; ${e._yaml_error}</span>`:e.yaml?o.qy`<span style="color: var(--success-color, green);">&#x2705; ${(0,nt.localize)("editor.yaml_valid")}</span>`:o.s6;return o.qy`
      <div class="custom-badge-item" data-index=${t}
        style="border: 1px solid var(--divider-color); border-radius: 8px; padding: 12px; margin-bottom: 12px; background: var(--card-background-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 14px;">Badge ${t+1}</strong>
          <button @click=${()=>this._removeCustomBadge(t)}
            style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer;">&#x2715;</button>
        </div>
        <textarea rows="4" placeholder="type: entity&#10;entity: sun.sun"
          .value=${e.yaml||""}
          style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font-family: monospace; font-size: 12px; resize: vertical; box-sizing: border-box;"
          @change=${e=>this._updateCustomBadgeYaml(t,e.target.value)}></textarea>
        <div class="custom-badge-validation" style="font-size: 12px; min-height: 16px;">
          ${i}
        </div>
      </div>
    `}_renderAreaItems(e,t,i){return 0===e.length?o.qy`<div class="empty-state">${(0,nt.localize)("editor.no_areas")}</div>`:[...e].sort((t,o)=>{const n=i.indexOf(t.area_id),r=i.indexOf(o.area_id);return(-1!==n?n:9999+e.indexOf(t))-(-1!==r?r:9999+e.indexOf(o))}).map(e=>{const i=t.includes(e.area_id),n=this._expandedAreas.has(e.area_id),r=this._areaEntitiesCache.get(e.area_id);return o.qy`
        <div class="area-item"
          data-area-id=${e.area_id}
          draggable="true"
          @dragstart=${this._handleDragStart}
          @dragend=${this._handleDragEnd}
          @dragover=${this._handleDragOver}
          @dragleave=${this._handleDragLeave}
          @drop=${this._handleDrop}>
          <div class="area-header">
            <span class="drag-handle" draggable="true">&#x2630;</span>
            <input type="checkbox" class="area-checkbox"
              data-area-id=${e.area_id}
              ?checked=${!i}
              @change=${t=>this._areaVisibilityChanged(e.area_id,t.target.checked)} />
            <span class="area-name">${e.name}</span>
            ${e.icon?o.qy`<ha-icon class="area-icon" icon=${e.icon}></ha-icon>`:o.s6}
            <button class="expand-button ${n?"expanded":""}"
              data-area-id=${e.area_id}
              ?disabled=${i}
              @click=${t=>this._toggleAreaExpand(t,e.area_id)}>
              <span class="expand-icon">&#x25B6;</span>
            </button>
          </div>
          ${n?o.qy`
              <div class="area-content" data-area-id=${e.area_id}>
                ${r?this._renderAreaEntities(e.area_id,r):o.qy`<div class="loading-placeholder">${(0,nt.localize)("editor.loading_entities")}</div>`}
              </div>
            `:o.s6}
        </div>
      `})}_renderAreaEntities(e,t){const{groupedEntities:i,hiddenEntities:n,badgeCandidates:r,additionalBadges:a,availableEntities:s,defaultShowNames:c,namesVisible:l,namesHidden:d}=t,p=this._hass,u=[{key:"lights",label:(0,nt.localize)("editor.domain_lights"),icon:"mdi:lightbulb"},{key:"climate",label:(0,nt.localize)("editor.domain_climate"),icon:"mdi:thermostat"},{key:"covers",label:(0,nt.localize)("editor.domain_covers"),icon:"mdi:window-shutter"},{key:"covers_curtain",label:(0,nt.localize)("editor.domain_covers_curtain"),icon:"mdi:curtains"},{key:"covers_window",label:(0,nt.localize)("editor.domain_covers_window"),icon:"mdi:window-open-variant"},{key:"media_player",label:(0,nt.localize)("editor.domain_media_player"),icon:"mdi:speaker"},{key:"scenes",label:(0,nt.localize)("editor.domain_scenes"),icon:"mdi:palette"},{key:"vacuum",label:(0,nt.localize)("editor.domain_vacuum"),icon:"mdi:robot-vacuum"},{key:"fan",label:(0,nt.localize)("editor.domain_fan"),icon:"mdi:fan"},{key:"switches",label:(0,nt.localize)("editor.domain_switches"),icon:"mdi:light-switch"},{key:"locks",label:(0,nt.localize)("editor.domain_locks"),icon:"mdi:lock"}],h=u.some(e=>(i[e.key]?.length??0)>0),g=(r?.length??0)>0||(a?.length??0)>0;if(!h&&!g)return o.qy`<div class="empty-state">${(0,nt.localize)("editor.no_entities_in_area")}</div>`;const _=this._expandedGroups.get(e)||new Set;return o.qy`
      <div class="entity-groups">
        ${u.map(t=>{const r=i[t.key];if(!r||0===r.length)return o.s6;const a=n[t.key]||[],s=r.every(e=>a.includes(e)),c=r.some(e=>a.includes(e))&&!s,l=_.has(t.key);return o.qy`
            <div class="entity-group" data-group=${t.key}>
              <div class="entity-group-header"
                @click=${()=>this._toggleGroupExpand(e,t.key)}>
                <input type="checkbox" class="group-checkbox"
                  data-area-id=${e}
                  data-group=${t.key}
                  ?checked=${!s}
                  .indeterminate=${c}
                  @click=${e=>e.stopPropagation()}
                  @change=${i=>{i.stopPropagation();const o=i.target.checked;this._groupVisibilityChanged(e,t.key,o,r)}} />
                <ha-icon icon=${t.icon}></ha-icon>
                <span class="group-name">${t.label}</span>
                <span class="entity-count">(${r.length})</span>
                <button class="expand-button-small ${l?"expanded":""}"
                  @click=${i=>{i.stopPropagation(),this._toggleGroupExpand(e,t.key)}}>
                  <span class="expand-icon-small">&#x25B6;</span>
                </button>
              </div>
              ${l?o.qy`
                  <div class="entity-list" data-area-id=${e} data-group=${t.key}>
                    ${r.map(i=>{const n=p.states[i],r=n?.attributes.friendly_name||i.split(".")[1].replace(/_/g," "),s=a.includes(i);return o.qy`
                        <div class="entity-item">
                          <input type="checkbox" class="entity-checkbox"
                            ?checked=${!s}
                            @change=${o=>this._entityVisibilityChanged(e,t.key,i,o.target.checked)} />
                          <span class="entity-name">${r}</span>
                          <span class="entity-id">${i}</span>
                        </div>
                      `})}
                  </div>
                `:o.s6}
            </div>
          `})}
        ${g?this._renderBadgeGroup(e,r,a,s,n,c,l,d,_):o.s6}
      </div>
    `}_renderBadgeGroup(e,t,i,n,r,a,s,c,l){const d=this._hass,p=t.length+i.length;if(0===p)return o.qy``;const u=r.badges||[],h=t.length>0&&t.every(e=>u.includes(e)),g=t.some(e=>u.includes(e))&&!h,_=new Set(s||[]),f=new Set(c||[]),m=e=>(0,rt.LN)(e,a.has(e),_,f),v=l.has("badges");return o.qy`
      <div class="entity-group" data-group="badges">
        <div class="entity-group-header"
          @click=${()=>this._toggleGroupExpand(e,"badges")}>
          <input type="checkbox" class="group-checkbox"
            data-area-id=${e}
            data-group="badges"
            ?checked=${!h}
            .indeterminate=${g}
            @click=${e=>e.stopPropagation()}
            @change=${i=>{i.stopPropagation();const o=i.target.checked;this._groupVisibilityChanged(e,"badges",o,t)}} />
          <ha-icon icon="mdi:checkbox-multiple-blank-circle"></ha-icon>
          <span class="group-name">${(0,nt.localize)("editor.domain_badges")}</span>
          <span class="entity-count">(${p})</span>
          <button class="expand-button-small ${v?"expanded":""}"
            @click=${t=>{t.stopPropagation(),this._toggleGroupExpand(e,"badges")}}>
            <span class="expand-icon-small">&#x25B6;</span>
          </button>
        </div>
        ${v?o.qy`
            <div class="entity-list" data-area-id=${e} data-group="badges">
              ${t.map(t=>{const i=d.states[t],n=i?.attributes.friendly_name||t.split(".")[1].replace(/_/g," "),r=u.includes(t),a=m(t);return o.qy`
                  <div class="entity-item">
                    <input type="checkbox" class="entity-checkbox"
                      ?checked=${!r}
                      @change=${i=>this._entityVisibilityChanged(e,"badges",t,i.target.checked)} />
                    <span class="entity-name">${n}</span>
                    <input type="checkbox" class="badge-name-checkbox"
                      ?checked=${a}
                      title=${(0,nt.localize)("editor.badges_show_name")}
                      @change=${i=>this._badgeShowNameChanged(e,t,i.target.checked)} />
                    <span class="badge-name-label">${(0,nt.localize)("editor.badges_name_short")}</span>
                    <span class="entity-id">${t}</span>
                  </div>
                `})}

              ${i.length>0?o.qy`
                  <div class="badge-separator">${(0,nt.localize)("editor.badges_additional")}</div>
                  ${i.map(t=>{const i=d.states[t],n=i?.attributes.friendly_name||t.split(".")[1].replace(/_/g," "),r=m(t);return o.qy`
                      <div class="entity-item badge-additional-item">
                        <span class="entity-name">${n}</span>
                        <input type="checkbox" class="badge-name-checkbox"
                          ?checked=${r}
                          title=${(0,nt.localize)("editor.badges_show_name")}
                          @change=${i=>this._badgeShowNameChanged(e,t,i.target.checked)} />
                        <span class="badge-name-label">${(0,nt.localize)("editor.badges_name_short")}</span>
                        <span class="entity-id">${t}</span>
                        <button class="badge-remove-btn"
                          title=${(0,nt.localize)("editor.badges_remove")}
                          @click=${()=>this._badgeAdditionalChanged(e,t,!1)}>&#x2715;</button>
                      </div>
                    `})}
                `:o.s6}

              ${n.length>0?o.qy`
                  <div class="badge-add-section">
                    <select class="badge-entity-picker" data-area-id=${e}>
                      <option value="">${(0,nt.localize)("editor.badges_select_entity")}</option>
                      ${n.map(e=>o.qy`
                        <option value=${e.entity_id}>${e.name} (${e.entity_id})</option>
                      `)}
                    </select>
                    <button class="badge-add-button"
                      @click=${t=>this._addBadgeFromPicker(t,e)}>
                      ${(0,nt.localize)("editor.badges_add")}
                    </button>
                  </div>
                `:o.s6}
            </div>
          `:o.s6}
      </div>
    `}async _loadAreaEntities(e){if(!this._hass)return;const t=await async function(e,t){const i=Object.values(t.devices||{}),o=Object.values(t.entities||{}),n=new Set;for(const t of i)t.area_id===e&&n.add(t.id);const r={lights:[],covers:[],covers_curtain:[],covers_window:[],scenes:[],climate:[],media_player:[],vacuum:[],fan:[],switches:[],locks:[],automations:[],scripts:[],cameras:[]},a=o.filter(e=>e.labels?.includes("no_dboard")).map(e=>e.entity_id);for(const i of o){let o=!1;if(i.area_id?o=i.area_id===e:i.device_id&&n.has(i.device_id)&&(o=!0),!o)continue;if(a.includes(i.entity_id))continue;if(!t.states[i.entity_id])continue;if(i.hidden)continue;const s=t.entities?.[i.entity_id];if(s?.hidden)continue;const c=i.entity_id.split(".")[0],l=t.states[i.entity_id],d=l.attributes?.device_class;"light"===c?r.lights.push(i.entity_id):"cover"===c?"curtain"===d?r.covers_curtain.push(i.entity_id):"window"===d||"door"===d||"gate"===d||"garage"===d?r.covers_window.push(i.entity_id):r.covers.push(i.entity_id):"scene"===c?r.scenes.push(i.entity_id):"climate"===c?r.climate.push(i.entity_id):"media_player"===c?r.media_player.push(i.entity_id):"vacuum"===c?r.vacuum.push(i.entity_id):"fan"===c?r.fan.push(i.entity_id):"switch"===c?r.switches.push(i.entity_id):"lock"===c&&r.locks.push(i.entity_id)}return r}(e,this._hass),i=ut(e,this._config),o=ht(e,this._config),n=st(e,this._hass),r=ct(e,this._config),a=lt(e,this._hass,n,r),s=dt(n,this._hass),{namesVisible:c,namesHidden:l}=pt(e,this._config);this._areaEntitiesCache.set(e,{groupedEntities:t,hiddenEntities:i,entityOrders:o,badgeCandidates:n,additionalBadges:r,availableEntities:a,defaultShowNames:s,namesVisible:c,namesHidden:l}),this.requestUpdate()}_refreshAreaCache(e){if(!this._hass||!this._areaEntitiesCache.has(e))return;const t=this._areaEntitiesCache.get(e).groupedEntities,i=ut(e,this._config),o=ht(e,this._config),n=st(e,this._hass),r=ct(e,this._config),a=lt(e,this._hass,n,r),s=dt(n,this._hass),{namesVisible:c,namesHidden:l}=pt(e,this._config);this._areaEntitiesCache.set(e,{groupedEntities:t,hiddenEntities:i,entityOrders:o,badgeCandidates:n,additionalBadges:r,availableEntities:a,defaultShowNames:s,namesVisible:c,namesHidden:l})}_toggleChanged(e,t,i){if(!this._hass)return;const o={...this._config,[e]:t};t===i&&delete o[e],this._config=o,this._fireConfigChanged(o)}_summariesColumnsChanged(e){if(!this._hass)return;const t={...this._config,summaries_columns:e};2===e&&delete t.summaries_columns,this._config=t,this._fireConfigChanged(t)}_alarmEntityChanged(e){if(!this._hass)return;const t=e.target.value,i={...this._config,alarm_entity:t};t&&""!==t||delete i.alarm_entity,this._config=i,this._fireConfigChanged(i)}_batteryCriticalChanged(e){const t=parseInt(e.target.value,10);if(isNaN(t)||t<1||t>99)return;const i={...this._config,battery_critical_threshold:t};20===t&&delete i.battery_critical_threshold,this._config=i,this._fireConfigChanged(i)}_batteryLowChanged(e){const t=parseInt(e.target.value,10);if(isNaN(t)||t<1||t>99)return;const i={...this._config,battery_low_threshold:t};50===t&&delete i.battery_low_threshold,this._config=i,this._fireConfigChanged(i)}_addFavoriteFromSelect(){const e=this.shadowRoot.querySelector("#favorite-entity-select");e&&e.value&&(this._addFavoriteEntity(e.value),e.value="")}_addFavoriteEntity(e){if(!this._hass)return;const t=this._config.favorite_entities||[];if(t.includes(e))return;const i={...this._config,favorite_entities:[...t,e]};this._config=i,this._fireConfigChanged(i)}_removeFavoriteEntity(e){if(!this._hass)return;const t=(this._config.favorite_entities||[]).filter(t=>t!==e),i={...this._config,favorite_entities:t.length>0?t:void 0};0===t.length&&delete i.favorite_entities,this._config=i,this._fireConfigChanged(i)}_addRoomPinFromSelect(){const e=this.shadowRoot.querySelector("#room-pin-entity-select");e&&e.value&&(this._addRoomPinEntity(e.value),e.value="")}_addRoomPinEntity(e){if(!this._hass)return;const t=this._config.room_pin_entities||[];if(t.includes(e))return;const i={...this._config,room_pin_entities:[...t,e]};this._config=i,this._fireConfigChanged(i)}_removeRoomPinEntity(e){if(!this._hass)return;const t=(this._config.room_pin_entities||[]).filter(t=>t!==e),i={...this._config,room_pin_entities:t.length>0?t:void 0};0===t.length&&delete i.room_pin_entities,this._config=i,this._fireConfigChanged(i)}_addCustomView(){const e=[...this._config.custom_views||[]];e.push({title:"Neue View",path:`custom-view-${e.length+1}`,icon:"mdi:card-text-outline",yaml:"",parsed_config:void 0});const t={...this._config,custom_views:e};this._config=t,this._fireConfigChanged(t)}_removeCustomView(e){const t=[...this._config.custom_views||[]];t.splice(e,1);const i={...this._config};0===t.length?delete i.custom_views:i.custom_views=t,this._config=i,this._fireConfigChanged(i)}_updateCustomViewField(e,t,i){const o=[...this._config.custom_views||[]];if(!o[e])return;o[e]={...o[e],[t]:i};const n={...this._config,custom_views:o};this._config=n,this._fireConfigChanged(n)}_updateCustomViewYaml(e,t){const i=[...this._config.custom_views||[]];if(!i[e])return;const o={...i[e],yaml:t};if(delete o._yaml_error,t.trim())try{const e=ot.load(t);e&&"object"==typeof e?o.parsed_config=e:(o._yaml_error="YAML muss ein Objekt ergeben",o.parsed_config=void 0)}catch(e){const t=e instanceof Error?e.message.split("\n")[0]:"Ungültiges YAML";o._yaml_error=t||"Ungültiges YAML",o.parsed_config=void 0}else o.parsed_config=void 0;i[e]=o;const n={...this._config,custom_views:i};this._config=n,this._fireConfigChanged(n)}_customCardsHeadingChanged(e){const t=e.target.value.trim(),i={...this._config};t?i.custom_cards_heading=t:delete i.custom_cards_heading,this._config=i,this._fireConfigChanged(i)}_customCardsIconChanged(e){const t=e.target.value.trim(),i={...this._config};t?i.custom_cards_icon=t:delete i.custom_cards_icon,this._config=i,this._fireConfigChanged(i)}_addCustomCard(){const e=[...this._config.custom_cards||[]];e.push({title:"",yaml:"",parsed_config:void 0});const t={...this._config,custom_cards:e};this._config=t,this._fireConfigChanged(t)}_removeCustomCard(e){const t=[...this._config.custom_cards||[]];t.splice(e,1);const i={...this._config};0===t.length?delete i.custom_cards:i.custom_cards=t,this._config=i,this._fireConfigChanged(i)}_updateCustomCardField(e,t,i){const o=[...this._config.custom_cards||[]];if(!o[e])return;o[e]={...o[e],[t]:i};const n={...this._config,custom_cards:o};this._config=n,this._fireConfigChanged(n)}_updateCustomCardYaml(e,t){const i=[...this._config.custom_cards||[]];if(!i[e])return;const o={...i[e],yaml:t};if(delete o._yaml_error,t.trim())try{const e=ot.load(t);e&&"object"==typeof e?o.parsed_config=e:(o._yaml_error="YAML muss ein Objekt oder Array ergeben",o.parsed_config=void 0)}catch(e){const t=e instanceof Error?e.message.split("\n")[0]:"Ungültiges YAML";o._yaml_error=t||"Ungültiges YAML",o.parsed_config=void 0}else o.parsed_config=void 0;i[e]=o;const n={...this._config,custom_cards:i};this._config=n,this._fireConfigChanged(n)}_addCustomBadge(){const e=[...this._config.custom_badges||[]];e.push({yaml:"",parsed_config:void 0});const t={...this._config,custom_badges:e};this._config=t,this._fireConfigChanged(t)}_removeCustomBadge(e){const t=[...this._config.custom_badges||[]];t.splice(e,1);const i={...this._config};0===t.length?delete i.custom_badges:i.custom_badges=t,this._config=i,this._fireConfigChanged(i)}_updateCustomBadgeYaml(e,t){const i=[...this._config.custom_badges||[]];if(!i[e])return;const o={...i[e],yaml:t};if(delete o._yaml_error,t.trim())try{const e=ot.load(t);e&&"object"==typeof e?o.parsed_config=e:(o._yaml_error="YAML muss ein Objekt ergeben",o.parsed_config=void 0)}catch(e){const t=e instanceof Error?e.message.split("\n")[0]:"Ungültiges YAML";o._yaml_error=t||"Ungültiges YAML",o.parsed_config=void 0}else o.parsed_config=void 0;i[e]=o;const n={...this._config,custom_badges:i};this._config=n,this._fireConfigChanged(n)}_areaVisibilityChanged(e,t){if(!this._hass)return;let i=[...this._config.areas_display?.hidden||[]];t?i=i.filter(t=>t!==e):(i.includes(e)||i.push(e),this._expandedAreas.delete(e),this._expandedGroups.delete(e),this._areaEntitiesCache.delete(e));const o={...this._config,areas_display:{...this._config.areas_display,hidden:i}};0===o.areas_display?.hidden?.length&&delete o.areas_display.hidden,o.areas_display&&0===Object.keys(o.areas_display).length&&delete o.areas_display,this._config=o,this._fireConfigChanged(o)}_toggleAreaExpand(e,t){e.stopPropagation();const i=new Set(this._expandedAreas);if(i.has(t)){i.delete(t);const e=new Map(this._expandedGroups);e.delete(t),this._expandedGroups=e}else i.add(t),this._areaEntitiesCache.has(t)||this._loadAreaEntities(t);this._expandedAreas=i}_toggleGroupExpand(e,t){const i=new Map(this._expandedGroups),o=new Set(i.get(e)||[]);o.has(t)?o.delete(t):o.add(t),o.size>0?i.set(e,o):i.delete(e),this._expandedGroups=i}_groupVisibilityChanged(e,t,i,o){if(!this._hass)return;const n=((this._config.areas_options?.[e]||{}).groups_options||{})[t];let r=[...n?.hidden||[]];r=i?r.filter(e=>!o.includes(e)):[...new Set([...r,...o])],this._updateEntityConfig(e,t,r)}_entityVisibilityChanged(e,t,i,o){if(!this._hass)return;if("badges_additional"===t)return void this._badgeAdditionalChanged(e,i,o);if("badges_show_name"===t)return void this._badgeShowNameChanged(e,i,o);const n=((this._config.areas_options?.[e]||{}).groups_options||{})[t];let r=[...n?.hidden||[]];o?r=r.filter(e=>e!==i):r.includes(i)||r.push(i),this._updateEntityConfig(e,t,r)}_updateEntityConfig(e,t,i){const o=this._config.areas_options?.[e]||{},n=o.groups_options||{},r={...n[t],hidden:i};0===r.hidden.length&&delete r.hidden;const a={...n,[t]:r};0===Object.keys(a[t]).length&&delete a[t];const s={...o,groups_options:a};0===Object.keys(s.groups_options).length&&delete s.groups_options;const c={...this._config.areas_options,[e]:s};0===Object.keys(c[e]).length&&delete c[e];const l={...this._config,areas_options:c};l.areas_options&&0===Object.keys(l.areas_options).length&&delete l.areas_options,this._config=l,this._fireConfigChanged(l),this._refreshAreaCache(e)}_badgeAdditionalChanged(e,t,i){if(!this._config)return;const o=this._config.areas_options?.[e]||{},n=o.groups_options||{},r=n.badges||{};let a=[...r.additional||[]];i?a.includes(t)||a.push(t):a=a.filter(e=>e!==t);const s={...r};a.length>0?s.additional=a:delete s.additional;const c={...n,badges:s};0===Object.keys(c.badges).length&&delete c.badges;const l={...o,groups_options:c};0===Object.keys(l.groups_options).length&&delete l.groups_options;const d={...this._config.areas_options,[e]:l};0===Object.keys(d[e]).length&&delete d[e];const p={...this._config,areas_options:d};p.areas_options&&0===Object.keys(p.areas_options).length&&delete p.areas_options,this._config=p,this._fireConfigChanged(p),this._refreshAreaCache(e)}_badgeShowNameChanged(e,t,i){if(!this._config||!this._hass)return;const o=this._config.areas_options?.[e]||{},n=o.groups_options||{},r=n.badges||{};let a=[...r.names_visible||[]],s=[...r.names_hidden||[]];const c=this._hass.states[t],l=c?.attributes?.device_class;i===(0,rt.g7)(l)?(a=a.filter(e=>e!==t),s=s.filter(e=>e!==t)):i?(a.includes(t)||a.push(t),s=s.filter(e=>e!==t)):(a=a.filter(e=>e!==t),s.includes(t)||s.push(t));const d={...r};a.length>0?d.names_visible=a:delete d.names_visible,s.length>0?d.names_hidden=s:delete d.names_hidden;const p={...n,badges:d};0===Object.keys(p.badges).length&&delete p.badges;const u={...o,groups_options:p};0===Object.keys(u.groups_options).length&&delete u.groups_options;const h={...this._config.areas_options,[e]:u};0===Object.keys(h[e]).length&&delete h[e];const g={...this._config,areas_options:h};g.areas_options&&0===Object.keys(g.areas_options).length&&delete g.areas_options,this._config=g,this._fireConfigChanged(g),this._refreshAreaCache(e)}_addBadgeFromPicker(e,t){e.stopPropagation();const i=this.shadowRoot.querySelector(`.badge-entity-picker[data-area-id="${t}"]`);if(!i||!i.value)return;const o=i.value;this._badgeAdditionalChanged(t,o,!0),i.value=""}_updateAreaOrder(){const e=this.shadowRoot.querySelector("#area-list");if(!e)return;const t=Array.from(e.querySelectorAll(".area-item")).map(e=>e.dataset.areaId??""),i={...this._config,areas_display:{...this._config.areas_display,order:t}};this._config=i,this._fireConfigChanged(i)}_fireConfigChanged(e){this._isUpdatingConfig=!0;const t={...e};t.custom_views&&(t.custom_views=t.custom_views.map(e=>{const t={...e};return delete t._yaml_error,t})),t.custom_cards&&(t.custom_cards=t.custom_cards.map(e=>{const t={...e};return delete t._yaml_error,t})),t.custom_badges&&(t.custom_badges=t.custom_badges.map(e=>{const t={...e};return delete t._yaml_error,t})),this._config=t;const i=new CustomEvent("config-changed",{detail:{config:t},bubbles:!0,composed:!0});this.dispatchEvent(i),setTimeout(()=>{this._isUpdatingConfig=!1},0)}}function st(e,t){const i=Object.values(t.devices||{}),o=Object.values(t.entities||{}),n=new Set;for(const t of i)t.area_id===e&&n.add(t.id);const r=[];for(const i of o){let o=!1;if(i.area_id?o=i.area_id===e:i.device_id&&n.has(i.device_id)&&(o=!0),!o)continue;if(i.hidden)continue;if(i.labels?.includes("no_dboard"))continue;if(!t.states[i.entity_id])continue;const a=i.entity_id.split(".")[0],s=t.states[i.entity_id],c=s.attributes?.device_class,l=s.attributes?.unit_of_measurement;if((0,rt.fF)(a,c,l,i.entity_id)){if("sensor"===a&&("battery"===c||i.entity_id.includes("battery"))){const e=parseFloat(s.state);!isNaN(e)&&e<20&&r.push(i.entity_id);continue}r.push(i.entity_id)}}return r}function ct(e,t){return t.areas_options?.[e]?.groups_options?.badges?.additional||[]}function lt(e,t,i,o){const n=Object.values(t.devices||{}),r=Object.values(t.entities||{}),a=new Set([...i,...o]),s=new Set;for(const t of n)t.area_id===e&&s.add(t.id);const c=[];for(const i of r){let o=!1;if(i.area_id?o=i.area_id===e:i.device_id&&s.has(i.device_id)&&(o=!0),!o)continue;if(i.hidden)continue;if(!t.states[i.entity_id])continue;const n=i.entity_id.split(".")[0];if("sensor"!==n&&"binary_sensor"!==n)continue;if(a.has(i.entity_id))continue;const r=t.states[i.entity_id],l=r.attributes?.friendly_name||i.entity_id.split(".")[1].replace(/_/g," ");c.push({entity_id:i.entity_id,name:l})}return c.sort((e,t)=>e.name.localeCompare(t.name)),c}function dt(e,t){const i=new Set;for(const o of e){const e=t.states[o];if(!e)continue;const n=e.attributes?.device_class;(0,rt.g7)(n)&&i.add(o)}return i}function pt(e,t){const i=t.areas_options?.[e]?.groups_options?.badges;return{namesVisible:i?.names_visible||[],namesHidden:i?.names_hidden||[]}}function ut(e,t){const i=t.areas_options?.[e];if(!i||!i.groups_options)return{};const o={};for(const[e,t]of Object.entries(i.groups_options))t.hidden&&(o[e]=t.hidden);return o}function ht(e,t){const i=t.areas_options?.[e];if(!i||!i.groups_options)return{};const o={};for(const[e,t]of Object.entries(i.groups_options))t.order&&(o[e]=t.order);return o}at.properties={_config:{state:!0},_expandedAreas:{state:!0},_expandedGroups:{state:!0}},at.styles=o.AH`
    .card-config { padding: 16px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 500; margin-bottom: 12px; color: var(--primary-text-color); }
    .form-row { display: flex; align-items: center; margin-bottom: 8px; }
    .form-row input[type="checkbox"], .form-row input[type="radio"] { margin-right: 8px; width: 18px; height: 18px; cursor: pointer; }
    .form-row input[type="checkbox"]:disabled, .form-row input[type="radio"]:disabled { cursor: not-allowed; opacity: 0.5; }
    .form-row label { cursor: pointer; user-select: none; }
    .form-row label.disabled-label { cursor: not-allowed; opacity: 0.5; }
    .form-row ha-entity-picker { flex: 1; max-width: 300px; }
    .form-row select { cursor: pointer; font-family: inherit; font-size: 14px; }
    .form-row select:focus { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .description { font-size: 12px; color: var(--secondary-text-color); margin-top: 4px; margin-left: 26px; margin-bottom: 16px; }
    .description strong { font-weight: 600; color: var(--primary-text-color); }
    .area-list { border: 1px solid var(--divider-color); border-radius: 8px; overflow: hidden; }
    .area-item { border-bottom: 1px solid var(--divider-color); background: var(--card-background-color); }
    .area-item:last-child { border-bottom: none; }
    .area-item.dragging { opacity: 0.5; }
    .area-item.drag-over { border-top: 2px solid var(--primary-color); }
    .area-header { display: flex; align-items: center; padding: 12px; }
    .drag-handle { margin-right: 12px; color: var(--secondary-text-color); cursor: grab; user-select: none; padding: 4px; }
    .drag-handle:active { cursor: grabbing; }
    .area-checkbox { margin-right: 12px; }
    .area-name { flex: 1; }
    .area-icon { margin-left: 8px; margin-right: 12px; color: var(--secondary-text-color); }
    .expand-button { background: none; border: none; padding: 4px 8px; cursor: pointer; color: var(--secondary-text-color); transition: transform 0.2s; }
    .expand-button:disabled { opacity: 0.3; cursor: not-allowed; }
    .expand-button.expanded .expand-icon { transform: rotate(90deg); }
    .expand-icon { display: inline-block; transition: transform 0.2s; }
    .area-content { padding: 0 12px 12px 48px; background: var(--secondary-background-color); }
    .loading-placeholder { padding: 12px; text-align: center; color: var(--secondary-text-color); font-style: italic; }
    .entity-groups { padding-top: 8px; }
    .entity-group { margin-bottom: 8px; border: 1px solid var(--divider-color); border-radius: 4px; background: var(--card-background-color); }
    .entity-group-header { display: flex; align-items: center; padding: 8px 12px; cursor: pointer; user-select: none; }
    .entity-group-header:hover { background: var(--secondary-background-color); }
    .group-checkbox { margin-right: 8px; width: 16px; height: 16px; cursor: pointer; }
    .group-checkbox[data-indeterminate="true"] { opacity: 0.6; }
    .entity-group-header ha-icon { margin-right: 8px; --mdc-icon-size: 18px; color: var(--secondary-text-color); }
    .group-name { flex: 1; font-weight: 500; }
    .entity-count { color: var(--secondary-text-color); font-size: 12px; margin-right: 8px; }
    .expand-button-small { background: none; border: none; padding: 4px; cursor: pointer; color: var(--secondary-text-color); }
    .expand-button-small.expanded .expand-icon-small { transform: rotate(90deg); }
    .expand-icon-small { display: inline-block; font-size: 12px; transition: transform 0.2s; }
    .entity-list { padding: 8px 12px 8px 36px; border-top: 1px solid var(--divider-color); }
    .entity-item { display: flex; align-items: center; padding: 6px 0; }
    .entity-checkbox { margin-right: 8px; width: 16px; height: 16px; cursor: pointer; }
    .entity-name { flex: 1; font-size: 14px; }
    .entity-id { font-size: 11px; color: var(--secondary-text-color); font-family: monospace; margin-left: 8px; }
    .empty-state { padding: 24px; text-align: center; color: var(--secondary-text-color); font-style: italic; }
    .badge-separator { padding: 8px 0 4px; font-size: 12px; font-weight: 500; color: var(--secondary-text-color); border-top: 1px dashed var(--divider-color); margin-top: 4px; }
    .badge-additional-item { padding-left: 0; }
    .badge-remove-btn { background: none; border: none; padding: 2px 6px; cursor: pointer; color: var(--error-color, #db4437); font-size: 14px; margin-left: 8px; border-radius: 4px; }
    .badge-remove-btn:hover { background: var(--secondary-background-color); }
    .badge-add-section { display: flex; gap: 8px; padding: 8px 0 4px; align-items: center; }
    .badge-entity-picker { flex: 1; padding: 6px 8px; border: 1px solid var(--divider-color); border-radius: 4px; background: var(--card-background-color); color: var(--primary-text-color); font-size: 13px; }
    .badge-add-button { padding: 6px 12px; border: 1px solid var(--divider-color); border-radius: 4px; background: var(--primary-color); color: var(--text-primary-color, #fff); cursor: pointer; font-size: 13px; white-space: nowrap; }
    .badge-add-button:hover { opacity: 0.9; }
    .badge-name-checkbox { margin-left: auto; margin-right: 2px; width: 14px; height: 14px; cursor: pointer; }
    .badge-name-label { font-size: 11px; color: var(--secondary-text-color); margin-right: 8px; white-space: nowrap; }
  `,customElements.define("simon42-dashboard-strategy-editor",at)}}]);