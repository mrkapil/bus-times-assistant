/* global module */
// Alexa doesn't like ampersands in SSML
function cleanSSMLResponse(str) {
  return str.replace(/&/g, 'and');
}

function convertToNonSSML(str) {
  return str.replace(/<(?:.|\n)*?>/gm, '');
}


function replaceParams(str, params) {
  const missingParams = [];

  const result = str.replace(/{{([a-z]+)}}/gi, (match, v) => {
    const replacement = params[v];

    if (replacement) {
      return replacement;
    } else {
      missingParams.push(v);
      return v;
    }
  });

  return {
    result,
    missingParams
  };
}

function getMissingParams(str) {
  const { missingParams } = replaceParams(str, {});
  return missingParams;
}

class Response {
  constructor(str, isPrompt, isSSML) {
    this.str = str;
    this._isPrompt = isPrompt;
    this.isSSML = isSSML;
  }

  isPrompt() {
    return this._isPrompt;
  }

  getPlainStr() {
    return convertToNonSSML(this.str);
  }

  getSSML() {
    if (this.isSSML) {
      return cleanSSMLResponse(`<speak>${this.str}</speak>`);
    } else {
      return this.getPlainStr();
    }
  }

  hasMissingParams() {
    const missingParams = this.getMissingParams();
    return missingParams && missingParams.length > 0;
  }

  getMissingParams() {
    return getMissingParams(this.str);
  }

  replaceParams(params) {
    const { result } = replaceParams(this.str, params);
    return new Response(result, this.isPrompt(), this.isSSML);
  }
}

module.exports = Response;