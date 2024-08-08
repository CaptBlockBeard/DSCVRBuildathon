import { CanvasInterface, CanvasClient } from '@dscvr-one/canvas-client-sdk';



export const handleResponse = async () => {

const canvasClient = new CanvasClient();

const response = await canvasClient.ready();
//
if (response) {
  // The handshake allows access to the user and the content that the application is embedded in.
  const user = response.untrusted.user;
  const content= response.untrusted.content;
  console.log(user);
  console.log(content);

  return {user, content};
}

};

