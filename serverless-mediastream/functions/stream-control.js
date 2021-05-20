const TokenValidator = require('twilio-flex-token-validator').functionValidator;

exports.handler = async (context, event, callback) => {
  // Set up HTTP response headers
  const response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST GET');
  response.appendHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, X-Twilio-Signature'
  );

  console.log(event.Token);
  const twilioClient = context.getTwilioClient();
  const twiml = new Twilio.twiml.VoiceResponse();

  const stop = twiml.stop();
  const start = twiml.start();

  if (event.transfer === true) {
    console.log('PREVENTING CALL FROM ENDING ON TRANSFER');
    try {
      const updateCall = await twilioClient
        .conferences(event.confSid)
        .participants(event.callSid)
        .update({ endConferenceOnExit: false, hold: true });

      response.setBody({ Status: 'SUCCESS', ResponseData: updateCall });
      callback(null, response);
    } catch (err) {
      console.log('Error is -', err);
      response.setBody({ Status: 'FAIL', ResponseData: err });
      callback(err, response);
    }
  } else {
    const { callSid, taskSid, confSid, stream, workerSid } = event;
    const url = context.MEDIA_STREAM_URL;

    console.log('STREAM URL: ', url);

    try {
      // Start new stream
      const startStream = start.stream({
        name: `Stream_${workerSid}`,
        url,
        track: 'both_tracks',
      });

      const dial = twiml.dial();
      dial.conference({ endConferenceOnExit: true }, taskSid);
      console.log('Stream TwiML is', twiml.toString());

      twilioClient
        .conferences(confSid)
        .participants(callSid)
        .update({ endConferenceOnExit: false })
        .then((participant) => {
          return twilioClient.calls(callSid).update({
            twiml: twiml.toString(),
          });
        })
        .then((data) => {
          response.setBody({ Status: 'SUCCESS', ResponseData: data });
          callback(null, response);
        });
    } catch (err) {
      console.log('Error is -', err);
      response.setBody({ Status: 'FAIL', ResponseData: err });
      callback(err, response);
    }
  }

  if (event.wrapup === true) {
    // Stop existing stream
    try {
      const { callSid, confSid, taskSid, workerSid } = event;
      const stopStream = stop.stream({ name: `Stream_${workerSid}` });
      const dial = twiml.dial();
      dial.conference({ endConferenceOnExit: true }, taskSid);
      console.log('Stream TwiML is', twiml.toString());

      twilioClient
        .conferences(confSid)
        .participants(callSid)
        .update({ endConferenceOnExit: false })
        .then((participant) => {
          return twilioClient.calls(callSid).update({
            twiml: twiml.toString(),
          });
        })
        .then((data) => {
          response.setBody({ Status: 'SUCCESS', ResponseData: data });
          callback(null, response);
        });
    } catch (err) {
      console.log('Error is -', err);
      response.setBody({ Status: 'FAIL', ResponseData: err });
      callback(err, response);
    }
  }
};
