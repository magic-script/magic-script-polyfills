export function streamToArrayBuffer(stream) {

}

export function streamToString(stream) {

}

export function streamToParsedJson(stream) {
    
}

return consume(this.body);
}

async text () {
  return binToStr(await consume(this.body));
}

async json () {
  return JSON.parse(binToStr(await consume(this.body)));