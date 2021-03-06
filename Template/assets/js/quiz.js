/*
* quiz.js v0.2.1 - 15/12/04
* Ergänzend zum elearn.js v0.6
* JavaScript Quiz - by Arne Westphal
* eLearning Buero MIN-Fakultaet - Universitaet Hamburg
*/

var correctQs = [];

/**
* Aktiviert alle <button> mit der Klasse "quizButton" für das Quiz.
* Wenn fragen <input> fokussiert ist, kann mit Enter die Antwort abgeschickt werden.
*/
$(document).ready(function() {
    init();
});


/**
* Diese Funktion initialisiert das Quiz.
*/
function init() {
    // Keine Tastaturnavigation
    keyAllowed = false;

    // Buttons hinzufügen
    $('div.question').after('<button class="quizButton">Lösen</button><button class="quizButton weiter">Zurücksetzen</button>');

    // Hide Feedbacks
    $("div.question").children("div.feedback").hide();

    // Add No Selection Feedback
    $("div.question").append('<div class="feedback noselection">Du musst diese Frage zuerst beantworten, bevor du lösen kannst.</div>');

    // Hide Weiter-Buttons
    $("button.weiter").hide();


    windowResizing();
    $(window).resize(function() {windowResizing()});

    shuffleAnswers();
    replaceRandoms();

    $(":button").filter(".quizButton").click(function() {
        submitAns(this);
    });

    // Submit with enter for every question possible
    $(".answers label").keyup(function(event) {
        if(event.which == 13) {
            $(this).closest("div.question").next(':button').click();
        }
    });

    $("#neustart").click(function() {
        resetQuiz();
    });

    resetQuiz();
}

/**
* Wird beim Bestätigen einer Antwort aufgeruffen.
* @param button - ist der geklickte Button von dem aus die beantwortete Frage
*                 bestimmt wird.
*/
function submitAns(button) {
    if($(button).filter(".weiter").length > 0) {
        button = $(button).prev(":button");
    }
    var div = $(button).prev('div.question');

    // Falls die Frage bereits beantwortet wurde, wird sie zurückgesetzt. (2. Button)
    if(div.is('.answered')) {
        div.removeClass("answered");
        div.find(".feedback").hide();
        deleteLabelColoring(div.find("label"));
        div.find("input:text").val("");
        div.find("input:radio").prop("checked", false);
        div.find("input:checkbox").prop("checked", false);

        div.next("button.quizButton").show();
        div.nextUntil("div").filter("button.quizButton.weiter").hide();
        correctQs[correctQs.length] = null;
        return;
    }

    var c = getCorrectAnswers(div);

    var labels = div.children('.answers').children('label');
    deleteLabelColoring(labels);

    var type = labels.children('input').attr("type");

    var correct = true;

    if(type === "text") {
        correct = getCorrectForText(labels, c);
    }
    else if (type === "radio" || type === "checkbox") {
        correct = getCorrectForRadio(labels, c, true);
    }

    if(correct === -1) {
        deleteLabelColoring(labels);
        div.children("div.feedback").filter(".correct").hide();
        div.children("div.feedback").filter(".incorrect").hide();
        div.children("div.feedback").filter(".noselection").show();
        return;
    }
    else if(correct) {
        div.children("div.feedback").filter(".noselection").hide();
        div.children("div.feedback").filter(".incorrect").hide();
        div.children("div.feedback").filter(".correct").show();
    }
    else {
        div.children("div.feedback").filter(".noselection").hide();
        div.children("div.feedback").filter(".correct").hide();
        div.children("div.feedback").filter(".incorrect").show();
    }

    div.addClass("answered");
    div.next("button.quizButton").hide();
    div.nextUntil("div").filter("button.quizButton.weiter").show();
    correctQs[correctQs.length] = correct;
};


/**
* Gibt zurück, ob die Frage richtig beantwortet wurde bei einer Radio-Type-Frage.
* -1 Falls keine Antwort ausgewählt.
* @param labels      - alle labels die in der Frage vorkommen
* @param c           - alle korrekten Antworten. Ein Array, dass die aus <a class="ans></a> jeweiligen MD5 Verschlüsselten Antworten beinhaltet.
* @param colorLabels - true, Labels automatisch je nach korrektheit gefärbt werden sollen.
*                            Es werden alle Antworten die richtigen Antworten auf die Frage grün gefärbt.
*                            Fälschlicherweise angekreute Antworten werden rot markiert. Falsche und nicht angekreuzte Antworten bleiben weiß.
*/
function getCorrectForRadio(labels, c, colorLabels) {
    var correct = true;
    var numberofchecked = 0;
    labels.each(function(i) {
        var input = $(this).find('input');
        var correctAnswer = contains(c, encryptMD5(input.val()));

        if(input.is(':checked')) {
            numberofchecked++;
        }

        if(correctAnswer != input.is(':checked')) {
            correct = false;
        }

        if(colorLabels) {
            if(correctAnswer) {
                $(this).addClass('right');
            }
            else if(input.is(':checked')){
                $(this).addClass('wrong');
            }
        }
    });
    if(numberofchecked === 0) {
        correct = -1;
    }
    return correct;
};


/**
* Gibt zurück, ob die eingegebene Antwort zu den korrekten gehört.
* -1 falls Textfeld leer.
*/
function getCorrectForText(labels, c) {
    var correct = true;
    var ans = labels.children('input').val();
    ans = encryptMD5(ans);
    if(!contains(c, ans)) {
        correct = false;
    }
    if(labels.children('input').val().length == 0) {
        correct = -1;
    }

    if(correct) {
        labels.addClass("right");
    }
    else {
        labels.addClass("wrong");
    }
    return correct;
};

/**
* Liest für ein <div> alle als korrekt angegebenen Antworten aus.
* Diese sollten MD5 Verschlüsselt sein.
*/
function getCorrectAnswers(div) {
    var c = [];
    div.find('a.ans').each(function(i) {
        c[c.length] = $(this).html();
    });
    return c;
};

/**
* Entfernt für alle übergebenen Labels die färbenden Klassen "right" und "wrong"
*/
function deleteLabelColoring(labels) {
    labels.each(function() {
        $(this).removeClass('right');
        $(this).removeClass('wrong');
    });
};

/**
* Gibt zurück, ob val in dem array vorhanden ist.
* Es wird auch auf Typ-Gleichheit geprüft.
*/
function contains(array, val) {
    var found = false;
    for(var i=0; i<array.length; i++) {
        if(array[i] === val) {
            found = true;
        }
    }
    return found;
};


/**
* Mischt die Antwortenreihenfolge bei dafür markierten Fragen.
*/
function shuffleAnswers() {
    $("div.answers").filter(".shuffle").each(function(i) {
        var labels = $(this).children("label");
        shuffle(labels);
        $(labels).remove();
        $(this).append($(labels));
        $(this).removeClass("shuffle");
    });
}

/**
* Ersetzt alle Inputs mit "rnd" als Value und %rnd im Text durch Werte aus dem vorgegebenem Wertebereich.
*/
function replaceRandoms() {
    $("div.answers").filter(".rnd").each(function(i) {
        var bereich = $(this).attr('class').replace("answers", "").replace("rnd","").replace("shuffle","").replace(/\s+/, "");
        var min = parseInt(bereich.split("-")[0]);
        var max = parseInt(bereich.split("-")[1]);
        var mul = parseInt(bereich.split("-")[2]);
        var inputs = $(this).children("label").children("input").filter(".rnd");
        var ohneZahlen = [];
        $(this).children("label").children("input").not(".rnd").each(function(j,c) {
            ohneZahlen[ohneZahlen.length] = parseInt($(c).val())/mul;
        });
        var randoms = zufallsArray(ohneZahlen, inputs.length, min, max);
        $(inputs).each(function(j, c) {
            $(this).removeClass("rnd");
            $(this).val(randoms[j]*mul);
            $(this).parent().html($(this).parent().html().replace("%rnd", randoms[j]*mul));
        });
        $(this).removeClass("rnd");
        $(this).removeClass(bereich);
    });
}

/**
    Gibt eine ganze Zufallszahl zwischen der unteren und oberen Grenze (beide enthalten) zurück.
*/
function randomInt(untereGrenze, obereGrenze) {
    var x = Math.floor((Math.random() * (obereGrenze-untereGrenze+1)) + untereGrenze);
    return x;
}

/**+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0] */
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

/**
    Gibt ein Array zurück mit 'anzahl' Zufallszahlen zwischen untereG. und obereG. ohne die 'ohneZahl'
*/
function zufallsArray(ohneZahlen, anzahl, untereGrenze, obereGrenze) {
    var zufallArray = [];
    var x=0;
    do{
        x=randomInt(untereGrenze, obereGrenze);
        if($.inArray(x, zufallArray) == -1 && $.inArray(x, ohneZahlen) == -1) zufallArray[zufallArray.length] = x;
    } while(zufallArray.length < anzahl);
    return zufallArray;
}



/**
* Bricht die Antworten in neue Zeile unter das Bild, falls das Bild mehr als 60%
* der Breite einnimmt oder die Antworten mehr als 2 mal so hoch wie das Bild sind.
*/
function windowResizing() {
    $('div.question').each(function(e,i) {
        var maxWidth = 0;
        var maxHeight = 0;
        $(this).children('img').each(function() {
            maxWidth = Math.max(maxWidth, $(this).width());
            maxHeight = Math.max(maxHeight, $(this).outerHeight());
        });


        if(maxWidth*100/$('.question:visible').width() > 80 || $('.question:visible').children('div.answers').outerHeight() > 2*maxHeight) {
            $(this).children('img').css("float", "none");
            $(this).children('div.answers').css("padding-left", "0");
        }
        else {
            $(this).children('img').css("float", "left");
            $(this).children('div.answers').css("padding-left", maxWidth + "px");
        }
    });
}

/**
* Setzt alle Fragen des Quiz' auf den Anfangszustand zurück.
*/
function resetQuiz() {
    correctQs = [];
    $(".question").removeClass("answered");
    $(".feedback").hide();
    deleteLabelColoring($("label"));
    $("input:text").val("");
    $("input:radio").prop("checked", false);
    $("input:checkbox").prop("checked", false);
}



/** *********************************************************************
*                                                                       *
*  MD5 Part                                                             *
*                                                                       *
* ******************************************************************** */

function encryptMD5(str) {
  //  discuss at: http://phpjs.org/functions/md5/
  // original by: Webtoolkit.info (http://www.webtoolkit.info/)
  // improved by: Michael White (http://getsprink.com)
  // improved by: Jack
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //    input by: Brett Zamir (http://brett-zamir.me)
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //  depends on: utf8_encode
  //   example 1: md5('Kevin van Zonneveld');
  //   returns 1: '6e658d4bfcb59cc13f96c14450ac40b9'

  var xl;

  var rotateLeft = function (lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  };

  var addUnsigned = function (lX, lY) {
    var lX4, lY4, lX8, lY8, lResult;
    lX8 = (lX & 0x80000000);
    lY8 = (lY & 0x80000000);
    lX4 = (lX & 0x40000000);
    lY4 = (lY & 0x40000000);
    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) {
      return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
      } else {
        return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
      }
    } else {
      return (lResult ^ lX8 ^ lY8);
    }
  };

  var _F = function (x, y, z) {
    return (x & y) | ((~x) & z);
  };
  var _G = function (x, y, z) {
    return (x & z) | (y & (~z));
  };
  var _H = function (x, y, z) {
    return (x ^ y ^ z);
  };
  var _I = function (x, y, z) {
    return (y ^ (x | (~z)));
  };

  var _FF = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var _GG = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var _HH = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var _II = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var convertToWordArray = function (str) {
    var lWordCount;
    var lMessageLength = str.length;
    var lNumberOfWords_temp1 = lMessageLength + 8;
    var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    var lWordArray = new Array(lNumberOfWords - 1);
    var lBytePosition = 0;
    var lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  };

  var wordToHex = function (lValue) {
    var wordToHexValue = '',
      wordToHexValue_temp = '',
      lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValue_temp = '0' + lByte.toString(16);
      wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
    }
    return wordToHexValue;
  };

  var x = [],
    k, AA, BB, CC, DD, a, b, c, d, S11 = 7,
    S12 = 12,
    S13 = 17,
    S14 = 22,
    S21 = 5,
    S22 = 9,
    S23 = 14,
    S24 = 20,
    S31 = 4,
    S32 = 11,
    S33 = 16,
    S34 = 23,
    S41 = 6,
    S42 = 10,
    S43 = 15,
    S44 = 21;


  str = this.utf8_encode(str);
  x = convertToWordArray(str);
  a = 0x67452301;
  b = 0xEFCDAB89;
  c = 0x98BADCFE;
  d = 0x10325476;

  xl = x.length;
  for (k = 0; k < xl; k += 16) {
    AA = a;
    BB = b;
    CC = c;
    DD = d;
    a = _FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
    d = _FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
    c = _FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
    b = _FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = _FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
    d = _FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
    c = _FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
    b = _FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = _FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
    d = _FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
    c = _FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
    b = _FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = _FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
    d = _FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
    c = _FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
    b = _FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
    a = _GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
    d = _GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
    c = _GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
    b = _GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
    a = _GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
    d = _GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = _GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
    b = _GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = _GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
    d = _GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
    c = _GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
    b = _GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = _GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
    d = _GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
    c = _GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
    b = _GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
    a = _HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
    d = _HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
    c = _HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
    b = _HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = _HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
    d = _HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
    c = _HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
    b = _HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = _HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
    d = _HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
    c = _HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
    b = _HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
    a = _HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
    d = _HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
    c = _HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
    b = _HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
    a = _II(a, b, c, d, x[k + 0], S41, 0xF4292244);
    d = _II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
    c = _II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
    b = _II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = _II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
    d = _II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
    c = _II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
    b = _II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = _II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
    d = _II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
    c = _II(c, d, a, b, x[k + 6], S43, 0xA3014314);
    b = _II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = _II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
    d = _II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
    c = _II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
    b = _II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);

  return temp.toLowerCase();
}

function utf8_encode(argString) {
  //  discuss at: http://phpjs.org/functions/utf8_encode/
  // original by: Webtoolkit.info (http://www.webtoolkit.info/)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: sowberry
  // improved by: Jack
  // improved by: Yves Sucaet
  // improved by: kirilloid
  // bugfixed by: Onno Marsman
  // bugfixed by: Onno Marsman
  // bugfixed by: Ulrich
  // bugfixed by: Rafal Kukawski
  // bugfixed by: kirilloid
  //   example 1: utf8_encode('Kevin van Zonneveld');
  //   returns 1: 'Kevin van Zonneveld'

  if (argString === null || typeof argString === 'undefined') {
    return '';
  }

  var string = (argString + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  var utftext = '',
    start, end, stringl = 0;

  start = end = 0;
  stringl = string.length;
  for (var n = 0; n < stringl; n++) {
    var c1 = string.charCodeAt(n);
    var enc = null;

    if (c1 < 128) {
      end++;
    } else if (c1 > 127 && c1 < 2048) {
      enc = String.fromCharCode(
        (c1 >> 6) | 192, (c1 & 63) | 128
      );
    } else if ((c1 & 0xF800) != 0xD800) {
      enc = String.fromCharCode(
        (c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
      );
    } else { // surrogate pairs
      if ((c1 & 0xFC00) != 0xD800) {
        throw new RangeError('Unmatched trail surrogate at ' + n);
      }
      var c2 = string.charCodeAt(++n);
      if ((c2 & 0xFC00) != 0xDC00) {
        throw new RangeError('Unmatched lead surrogate at ' + (n - 1));
      }
      c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
      enc = String.fromCharCode(
        (c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
      );
    }
    if (enc !== null) {
      if (end > start) {
        utftext += string.slice(start, end);
      }
      utftext += enc;
      start = end = n + 1;
    }
  }

  if (end > start) {
    utftext += string.slice(start, stringl);
  }

  return utftext;
}
