import Axios from 'axios';

const request = async (manager, params) => {
  const url = process.env.REACT_APP_SERVERLESS_BASE_URL;

  const data = {
    ...params,
    Token: manager.store.getState().flex.session.ssoTokenPayload.token,
  };

  const options = {
    method: 'post',
    url,
    data,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  console.debug('REQUEST OPTIONS: ', options);

  console.debug('Serverless URL: ', url);

  const response = await Axios(options);
  console.debug('Stream Control Response: ', response);
};

export default request;
