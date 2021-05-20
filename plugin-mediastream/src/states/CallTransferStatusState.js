import { combineReducers } from 'redux';

const ACTION_UPDATE_CALL_TRANSFER_STATUS = 'UPDATE_CALL_TRANSFER_STATUS';

const initialState = {
  callTransferStatus: null,
};

export const namespace = 'callTransferStatus';

export class Actions {
  static updateCallTransferStatus = (callTransferStatus) => ({
    type: ACTION_UPDATE_CALL_TRANSFER_STATUS,
    callTransferStatus,
  });
}

function reduce(state = initialState, action) {
  switch (action.type) {
    case ACTION_UPDATE_CALL_TRANSFER_STATUS: {
      return {
        ...state,
        callTransferStatus: action.callTransferStatus,
      };
    }
    default: {
      return state;
    }
  }
}

export default combineReducers({
  reduce,
});
