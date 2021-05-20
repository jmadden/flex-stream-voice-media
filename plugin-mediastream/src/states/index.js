import { combineReducers } from 'redux';
import CallTransferStatusReducer from './CallTransferStatusState';

// Register your redux store under a unique namespace
export const namespaceCallTransferStatus = 'callTransferStatus';

// Combine the reducers
export default combineReducers({
  callTransferStatus: CallTransferStatusReducer,
});
