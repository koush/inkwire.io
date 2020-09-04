
;

function PepperDecoder(encodeWidth, encodeHeight, decoder) {
  $('#listener').empty();
  var tool;
  var toolPath;
  var type;
  if (isElectron()) {
    tool = "host";
    toolPath = null;
    type = "application/x-ppapi-vysor";
  }
  else {
    tool = "pnacl";
    toolPath = "video_decode/pnacl/Release";
    type = null;
  }

  var hasInitialized;
  common.createNaClModule("video_decode", type, tool, toolPath, encodeWidth, encodeHeight, {}, function(message) {
    if (message.data == 'decoder-falling-behind') {
      if (this.onDecoderFallingBehind)
        this.onDecoderFallingBehind();
    }
    else if (message.data == 'paint-falling-behind') {
    }
    else if (message.data == 'graphics-context-null') {
      showModal({
        title: 'Graphics Error: assert !context_->is_null()',
        body: 'Vysor encountered an error with your graphics card. There is a possible solution available on the <a href="https://support.vysor.io/support/technical/graphics/" target="_blank">support page</a>.',
        hideCancel: true,
      })
    }
    else if (message.data == 'decoder-ready') {
      if (this.onReady)
        this.onReady();
      else
        console.error('no listener for decoder-ready')
    }
  }.bind(this), function() {
    if (hasInitialized) {
      console.error('NACL module has already initalized');
      console.error(hasInitialized);
      console.error(new Error('NACL New Initialization Stack'))
      return;
    }
    hasInitialized = new Error("NACL Initialization Stack");
    console.log('NACL module initialized')
    console.log('decoder:', decoder);
    common.naclModule.postMessage(decoder);
  }.bind(this));
}

PepperDecoder.prototype.connectH264 = function(serialno, password) {
  if (!common.naclModule || !common.naclModule.postMessage) {
    console.error('connectH264 called before initialization');
    return;
  }

  common.naclModule.postMessage({
    type: 'connectH264',
    hostCommand: prefixLen416('host:transport:' + serialno),
    clientCommand: prefixLen416('tcp:53517'),
    password: password + '\n'
  });
}

PepperDecoder.prototype.decode = function(video, presentationTimeMs, syncFrame) {
  if (!common.naclModule || !common.naclModule.postMessage) {
    console.error('decode called before initialization');
    return;
  }

  common.naclModule.postMessage({
    buffer: video.buffer,
    byteOffset: video.byteOffset,
    byteLength: video.byteLength,
    presentationTimeMs: presentationTimeMs,
    syncFrame: syncFrame,
  });
}

PepperDecoder.prototype.queueAudio = function(offset, audioBuffer0, audioBuffer1) {
  common.naclModule.postMessage({
    type: 'queueAudio',
    audioBuffer0: audioBuffer0.buffer,
    audioBuffer1: audioBuffer1.buffer,
    offset: offset,
    length: audioBuffer0.byteLength,
  });
}