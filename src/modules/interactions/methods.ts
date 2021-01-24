import c from 'centra';

import { logger } from '../../utils';
import Constants from '../constants/Constants';
import * as Sentry from '@sentry/node';

const appId: any = process.env.APPLICATION_ID?.toString();

const endpointGenerator = {
  reply: (
    txt: any,
    interactionid: any,
    interactiontoken: any,
  ) => {
    return txt
      .replace('<interaction_id>', interactionid)
      .replace('<interaction_token>', interactiontoken);
  },
  send: (txt: any, interactiontoken: any) => {
    return txt
      .replace('<interaction_token>', interactiontoken)
      .replace('<application_id>', appId);
  },
};

export default {
  // use this for initial reply and edit the response later on
  reply: async (
    interaction: any,
    msg: string,
    type = 3,
  ): Promise<any> => {
    // TODO: return interaction id and token to edit this interaction later on
    const returnobject = { error: false, data: {} };
    const endpoint = endpointGenerator.reply(
      Constants.interactionEndpoints.replyurl,
      interaction.id,
      interaction.token,
    );

    try {
      const res: any = await c(endpoint, 'POST')
        .body(
          {
            type,
            data: {
              embeds: [
                {
                  color: Constants.Colors['BLUE'],
                  title: msg,
                  author: {
                    icon_url: Constants.wiki_logo,
                    name: 'Wikipedia',
                  },
                },
              ],
            },
          },
          'json',
        )
        .send();

      if (res.statusCode >= 200) {
        returnobject.data = {
          id: interaction.id,
          token: interaction.token,
        };
      }
      return returnobject;
    } catch (e) {
      returnobject.error = true;
      logger.error(e);
      Sentry.captureException(e);
      return returnobject;
    }
  },
  send: async (
    interactionToken: any,
    data: any,
    type = 3,
  ) => {
    const endpoint = endpointGenerator.send(
      Constants.interactionEndpoints.create_followup_msg,
      interactionToken,
    );
    return await c(endpoint, 'POST')
      .body({ type, data }, 'json')
      .send();
  },
  deleteOriginal: async (interactionToken: any) => {
    const endpoint = endpointGenerator.send(
      Constants.interactionEndpoints.delete_original_msg,
      interactionToken,
    );
    return await c(endpoint, 'DELETE').send();
  },
  embed: {
    // edit and reply
    defaultWikiEmbed: async (
      interactionToken: any,
      embedobj: any,
    ) => {
      const color: any = Constants.Colors['BLUE'];

      const endpoint = endpointGenerator.send(
        Constants.interactionEndpoints.create_followup_msg,
        interactionToken,
      );

      return await c(endpoint, 'POST')
        .body(
          {
            embeds: [
              {
                color,
                title: embedobj.title,
                description: embedobj.desc,
                author: {
                  icon_url: Constants.wiki_logo,
                  name: 'Wikipedia',
                },
                timestamp: new Date(),
                url: embedobj.url,
                thumbnail: {
                  url: embedobj.thumb,
                },
                footer: {
                  icon_url: Constants.wiki_logo,
                  text: 'Example footer text, edit later',
                },
              },
            ],
          },
          'json',
        )
        .send();
    },

    defaultErrorEmbed: async (
      interactionToken: any,
      errormessage: any,
    ) => {
      const color: any = Constants.Colors['RED'];

      const endpoint = endpointGenerator.send(
        Constants.interactionEndpoints.create_followup_msg,
        interactionToken,
      );

      return await c(endpoint, 'POST')
        .body(
          {
            embeds: [
              {
                color,
                title: errormessage,
                author: {
                  icon_url: Constants.wiki_logo,
                  name: '❌ Error',
                },
              },
            ],
          },
          'json',
        )
        .send();
    },
  },
};
