function copyTextToClipboard(text) {
  var textArea = document.createElement("textarea");

  //
  // *** This styling is an extra step which is likely not required. ***
  //
  // Why is it here? To ensure:
  // 1. the element is able to have focus and selection.
  // 2. if element was to flash render it has minimal visual impact.
  // 3. less flakyness with selection and copying which **might** occur if
  //    the textarea element is not visible.
  //
  // The likelihood is the element won't even render, not even a flash,
  // so some of these are just precautions. However in IE the element
  // is visible whilst the popup box asking the user for permission for
  // the web page to copy to the clipboard.
  //

  // Place in top-left corner of screen regardless of scroll position.
  textArea.style.position = 'fixed';
  textArea.style.top = 0;
  textArea.style.left = 0;

  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  textArea.style.width = '2em';
  textArea.style.height = '2em';
  textArea.style["text-transform"] = "none"

  // We don't need padding, reducing the size if it does flash render.
  textArea.style.padding = 0;

  // Clean up any borders.
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';

  // Avoid flash of white box if rendered for any reason.
  textArea.style.background = 'transparent';


  textArea.value = text;

  document.body.appendChild(textArea);

  textArea.select();

  try {
    var successful = document.execCommand('copy');
    // var msg = successful ? 'successful' : 'unsuccessful';
    // console.log('Copying text command was ' + msg);
  } catch (err) {
    console.log('Oops, unable to copy');
  }

  document.body.removeChild(textArea);
}

function GcmManager(senders, registrationId) {
  this.senders = senders;
  this.registrationId = registrationId;
}
GcmManager.prototype.sendGcm = function(senderId, registrationId, dstPort, srcPort, type, message) {
  if (!senderId)
    senderId = this.defaultSenderId;
  if (registrationId.startsWith('web:')) {
    $.ajax({
        type: 'POST',
        url: "https://vysor-1026.appspot.com/send",
        data: JSON.stringify({
          channel : registrationId.substring(4),
          data : {
            senderId: senderId,
            src: this.registrationId,
            srcPort: srcPort,
            dstPort: dstPort,
            type: type,
            message: JSON.stringify(message)
          }
        }),
        contentType : 'application/json',
        dataType: "json",
        success: function() {
        }
    });
  }
  else {
    $.ajax({
        type: 'POST',
        url: "https://gcm-http.googleapis.com/gcm/send",
        headers: {"Authorization": "key=" + this.senders[senderId]},
        data: JSON.stringify({
          to : registrationId,
          data : {
            senderId: senderId,
            src: this.registrationId,
            srcPort: srcPort,
            dstPort: dstPort,
            type: type,
            message: JSON.stringify(message)
          }
        }),
        contentType : 'application/json',
        dataType: "json",
        error: function() {
          console.log('gcm error', arguments);
        },
        success: function() {
          console.log('gcm', arguments);
        }
    });
  }
}
GcmManager.start = function(senders, cb) {
  var socket = io("https://push.clockworkmod.com");
  // socket.emit('register');
  socket.on('registration', function(registrationId) {
    registrationId = 'web:' + registrationId;
    var gcm = new GcmManager(senders, registrationId);
    var self = gcm;

    socket.on('data', (data) => {
      self.onMessage(data)
    })
  
    self.registrationId = registrationId;
    cb(self);
  })
}
