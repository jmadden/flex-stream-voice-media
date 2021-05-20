import { Actions, Manager, TaskHelper } from '@twilio/flex-ui';
import FlexState from '../states/FlexState';
import { ReservationEvents } from '../enums';
import request from '../helpers/request';
import { Actions as CallTransferStatusActions } from '../states/CallTransferStatusState';

const manager = Manager.getInstance();
const reservationListeners = new Map();

manager.events.addListener('pluginsLoaded', () => {
  initialize();
});

// Retrieve customer's call SID
const customerCallSid = (participants) => {
  const customerObj = participants.filter(
    (participant) => participant.participantType === 'customer'
  );
  return customerObj[0].callSid;
};

// Disable beep
Actions.addListener('beforeAcceptTask', (payload) => {
  payload.conferenceOptions.beep = false;
});

Actions.addListener('beforeTransferTask', async (payload) => {
  const { participants } = payload.task.conference;
  const options = {
    transfer: true,
    confSid: payload.task.conference.conferenceSid,
    callSid: customerCallSid(participants),
  };
  const state = Manager.getInstance().store.getState();
  const { callTransferStatus } = state;
  console.debug(callTransferStatus.reduce.callTransferStatus);
  const transferStatus = true;
  const newPayload =
    CallTransferStatusActions.updateCallTransferStatus(transferStatus);
  FlexState.dispatchStoreAction.updateCallTransferStatus(newPayload);
  //await request(manager, options);
});

const stopReservationListeners = (reservation) => {
  const listeners = reservationListeners.get(reservation);
  if (listeners) {
    listeners.forEach((listener) => {
      reservation.removeListener(listener.event, listener.callback);
    });
    reservationListeners.delete(reservation);
  }
};

const handleReservationAccept = async (reservation) => {
  console.debug('RESERVATION OBJ: ', reservation);
  console.log(`### handleReservationAccept ${reservation.sid}`);
  const state = Manager.getInstance().store.getState();
  const { callTransferStatus } = state;
  console.debug('CALL TRANSFER STATE: ', callTransferStatus);

  const { customer } = reservation.task.attributes.conference.participants;
  const { sid: confSid } = reservation.task.attributes.conference;
  const { sid: taskSid } = reservation.task;
  const { outgoing: outgoingTransfer, incoming: incomingTransfer } =
    reservation.task.transfers;
  const { workerSid } = reservation;

  const requestOptions = {
    callSid: customer,
    confSid,
    taskSid,
    workerSid,
  };

  const startStream = (options) => {
    return new Promise((resolve, reject) => {
      request(manager, options)
        .then((response) => {
          console.log('STREAM RESPONSE:\r\n  ', response);
          resolve(response);
        })
        .catch((error) => {
          console.error(`ERRR STREAM \r\n`, error);
          reject(error);
        });
    });
  };
};

const handleReservationWrapup = async (reservation) => {
  console.log(`handleReservationWrapup: `, reservation);
  const { sid: confSid } = reservation.task.attributes.conference;
  const { sid: taskSid } = reservation.task;
  const { workerSid } = reservation;
  const { customer: callSid } =
    reservation.task.attributes.conference.participants;

  const requestOptions = {
    callSid,
    confSid,
    taskSid,
    workerSid,
  };

  const stopStream = (options) => {
    return new Promise((resolve, reject) => {
      request(manager, options)
        .then((response) => {
          console.log('STREAM RESPONSE:\r\n  ', response);
          resolve(response);
        })
        .catch((error) => {
          console.error(`ERRR STREAM \r\n`, error);
          reject(error);
        });
    });
  };

  const wrapup = true;
  const options = { ...requestOptions, wrapup };
  console.debug('STOP MEDIA OPTIONS: ', options);
  await stopStream(options);
};

const handleReservationEnded = async (reservation, eventType) => {
  console.log(`handleReservationEnded: `, reservation);
};

const handleReservationUpdated = (event, reservation) => {
  console.debug('Event, reservation updated', event, reservation);
  const state = Manager.getInstance().store.getState();
  const { callTransferStatus } = state;
  console.debug('CALL TRANSFER STATE: ', callTransferStatus);
  switch (event) {
    case ReservationEvents.accepted: {
      if (callTransferStatus.reduce.callTransferStatus === null) {
        handleReservationAccept(reservation);
      }
      break;
    }
    case ReservationEvents.wrapup: {
      handleReservationWrapup(reservation);
      break;
    }
    case ReservationEvents.timeout: {
      handleReservationEnded(reservation, ReservationEvents.timeout);
      stopReservationListeners(reservation);
      break;
    }
    case ReservationEvents.completed:
    case ReservationEvents.rejected:
    case ReservationEvents.canceled:
    case ReservationEvents.rescinded: {
      handleReservationEnded(reservation);
      stopReservationListeners(reservation);
      break;
    }
    default:
    // Nothing to do here
  }
};

const initReservationListeners = (reservation) => {
  const trueReservation = reservation.addListener
    ? reservation
    : reservation.source;
  const listeners = [];
  Object.values(ReservationEvents).forEach((event) => {
    const callback = () => handleReservationUpdated(event, trueReservation);
    trueReservation.addListener(event, callback);
    listeners.push({ event, callback });
  });
  reservationListeners.set(trueReservation, listeners);
};

const handleNewReservation = (reservation) => {
  console.debug('new reservation', reservation);
  initReservationListeners(reservation);
};

const handleReservationCreated = async (reservation) => {
  handleNewReservation(reservation);
};

manager.workerClient.on('reservationCreated', handleReservationCreated);

export const initialize = () => {
  for (const reservation of FlexState.workerTasks.values()) {
    handleNewReservation(reservation);
  }
};
